const { GoogleGenerativeAI } = require('@google/generative-ai');
const Achievement = require('../models/Achievement');
const Food = require('../models/Food');

// Simple in-memory cache for AI disease recommendations (10 min TTL)
const diseaseCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let genAI;
const getAI = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const generateContentWithFallback = async (prompt, imagePart = null) => {
  const ai = getAI();
  if (!ai) throw new Error("AI not initialized");
  
  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  let lastError;
  
  for (const modelName of models) {
    try {
      console.log(`[AI Fallback] Attempting generation with model: ${modelName}`);
      const model = ai.getGenerativeModel({ model: modelName });
      let result;
      if (imagePart) {
        result = await model.generateContent([prompt, imagePart]);
      } else {
        result = await model.generateContent(prompt);
      }
      console.log(`[AI Fallback] Model ${modelName} succeeded!`);
      return result;
    } catch (err) {
      console.warn(`[AI Fallback] Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }
  
  throw lastError;
};

const SYSTEM_PROMPT = `You are NutriBot, an expert AI nutrition and fitness assistant for NutriTrack.
Help users with meal planning, calorie tracking, workout suggestions, and health tips.
Be friendly, concise (under 200 words), and evidence-based.
Never diagnose medical conditions — always recommend consulting a doctor for medical concerns.`;

/* ─── POST /api/ai/chat ──────────────────────────────────── */
exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const ai = getAI();
    if (!ai) {
      return res.json({
        reply: "🤖 AI features require a Gemini API key in your .env file. Tip: aim for 25-30% protein, 45-55% carbs, 20-30% fat daily!",
      });
    }

    const chatHistory = [
      { role: 'user',  parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Hello! I am NutriBot. How can I help you today?' }] },
      ...history.slice(-10).map((h) => ({
        role:  h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
    ];

    const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
    let result, reply;
    
    for (const modelName of models) {
      try {
        console.log(`[AI Chat] Attempting model: ${modelName}`);
        const model = ai.getGenerativeModel({ model: modelName });
        const chat   = model.startChat({ history: chatHistory });
        result = await chat.sendMessage(message);
        reply  = result.response.text();
        console.log(`[AI Chat] Model ${modelName} succeeded!`);
        break;
      } catch (err) {
        console.warn(`[AI Chat Fallback] Model ${modelName} failed:`, err.message);
        if (modelName === models[models.length - 1]) throw err;
      }
    }

    const badge = await Achievement.unlock(req.user._id, 'ai_conversation');
    if (badge && req.io) req.io.to(`user_${req.user._id}`).emit('achievement', badge);

    res.json({ reply });
  } catch (err) {
    console.error('[AI chat]', err.message);
    res.status(500).json({ error: 'AI service error. Please try again.' });
  }
};

/* ─── POST /api/ai/meal-suggestions ─────────────────────── */
exports.mealSuggestions = async (req, res) => {
  // Declare at function scope so catch block can access
  let allowedFoods = [];
  let calorieTarget, proteinTarget, carbsTarget, fatTarget, waterTarget;
  let cuisine, mealsPerDay, allergies, smartFeatures;

  // Offline fallback helper - defined at function scope
  const getOfflineResponse = () => {
    const breakfasts = allowedFoods.filter(f => f.mealTypes && f.mealTypes.includes('breakfast'));
    const mains = allowedFoods.filter(f => f.mealTypes && (f.mealTypes.includes('lunch') || f.mealTypes.includes('dinner')));
    const snacks = allowedFoods.filter(f => f.mealTypes && f.mealTypes.includes('snack'));

    const selectedMeals = [];
    let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;

    const pickMeal = (list, slotLabel) => {
      if (list.length === 0) return null;
      const f = list[Math.floor(Math.random() * list.length)];
      const targetCalories = slotLabel === 'Snack' ? calorieTarget * 0.15 : (calorieTarget / mealsPerDay);
      let servings = Number((targetCalories / f.calories).toFixed(1));
      if (servings < 0.5) servings = 0.5;
      if (servings > 3.0) servings = 2.0;

      const mealCalories = Math.round(f.calories * servings);
      const mealProtein = Number((f.protein * servings).toFixed(1));
      const mealCarbs = Number((f.carbs * servings).toFixed(1));
      const mealFat = Number((f.fat * servings).toFixed(1));
      const mealFiber = Number(((f.fiber || 0) * servings).toFixed(1));

      totalCal += mealCalories;
      totalProt += mealProtein;
      totalCarbs += mealCarbs;
      totalFat += mealFat;

      return {
        meal: slotLabel,
        food: f.name,
        emoji: f.emoji || '🍽️',
        servings,
        calories: mealCalories,
        protein: mealProtein,
        carbs: mealCarbs,
        fat: mealFat,
        fiber: mealFiber
      };
    };

    if (mealsPerDay === 2) {
      const m1 = pickMeal(breakfasts.length > 0 ? breakfasts : mains, 'Meal 1 (Morning)');
      if (m1) selectedMeals.push(m1);
      const m2 = pickMeal(mains, 'Meal 2 (Evening)');
      if (m2) selectedMeals.push(m2);
    } else {
      const m1 = pickMeal(breakfasts.length > 0 ? breakfasts : mains, 'Breakfast');
      if (m1) selectedMeals.push(m1);
      const m2 = pickMeal(mains, 'Lunch');
      if (m2) selectedMeals.push(m2);
      const m3 = pickMeal(mains, 'Dinner');
      if (m3) selectedMeals.push(m3);
    }

    const groceryList = smartFeatures?.groceryList ? selectedMeals.map(m => `${m.servings}x serving of ${m.food}`) : [];
    const weeklyRotation = smartFeatures?.weeklyRotation ? [
      `Alternate with ${breakfasts[Math.floor(Math.random() * breakfasts.length)]?.name || 'Oats'} for Breakfast.`,
      `Alternate with ${mains[Math.floor(Math.random() * mains.length)]?.name || 'Brown Rice'} for Lunch/Dinner.`
    ] : [];

    const tips = ['Drink 8-10 glasses of water daily.', 'Eat small meals and keep consistent timings.'];
    if (smartFeatures?.aiHealthTips) {
      tips.push('Ensure fiber intake is above 25g to support digestive health.');
      tips.push('Prioritize post-workout protein to support muscle protein synthesis.');
    }
    if (smartFeatures?.hydrationReminder) {
      tips.push(`Hydration: Aim for ${waterTarget} of water. Drink 500ml upon waking and 500ml before meals.`);
    }

    return {
      meals: selectedMeals,
      groceryList,
      weeklyRotation,
      tips,
      macrosTotal: {
        calories: Math.round(totalCal),
        protein: Number(totalProt.toFixed(1)),
        carbs: Number(totalCarbs.toFixed(1)),
        fat: Number(totalFat.toFixed(1))
      },
      offline: true
    };
  };

  try {
    const body = req.body || {};
    cuisine = body.cuisine || 'south_indian';
    mealsPerDay = body.mealsPerDay || 3;
    allergies = body.allergies || [];
    const customAllergy = body.customAllergy || '';
    smartFeatures = body.smartFeatures || {};
    const targets = body.targets || {};

    calorieTarget = Number(targets.calories) || 2000;
    proteinTarget = Number(targets.protein) || 140;
    carbsTarget = Number(targets.carbs) || 230;
    fatTarget = Number(targets.fat) || 58;
    waterTarget = targets.water || '3-4 Liters';

    // 1. Fetch verified foods from database
    const allVerifiedFoods = await Food.find({ isVerified: true });

    // 2. Compile active exclusions
    const activeExclusions = [...allergies.map(a => a.toLowerCase())];
    if (customAllergy.trim()) {
      activeExclusions.push(customAllergy.trim().toLowerCase());
    }

    // 3. Filter foods strictly
    allowedFoods = allVerifiedFoods.filter(food => {
      const foodName = food.name.toLowerCase();
      const foodCategory = food.category.toLowerCase();
      const foodTags = (food.tags || []).map(t => t.toLowerCase());
      const foodCuisine = (food.cuisineType || '').toLowerCase();
      const foodDesc = `${foodName} ${foodCategory} ${foodTags.join(' ')} ${foodCuisine}`;

      // Cuisine Preferences
      if (cuisine === 'south_indian') {
        // If South Indian is selected, strictly exclude North Indian items
        if (foodCuisine === 'north_indian' || foodCategory === 'north_indian') {
          return false;
        }
      } else if (cuisine === 'north_indian') {
        // If North Indian is selected, strictly exclude South Indian items
        if (foodCuisine === 'south_indian' || foodCategory === 'south_indian') {
          return false;
        }
      } else if (cuisine === 'continental') {
        // If Continental is selected, strictly exclude traditional Indian items (e.g. South/North Indian specialties)
        const traditionalIndianTerms = [
          'dosa', 'idli', 'sambar', 'pongal', 'uttapam', 'curd rice', 'rasam', 'upma',
          'roti', 'chapati', 'naan', 'paratha', 'paneer butter masala', 'dal makhani',
          'rajma', 'chole bhature', 'biryani', 'samosa', 'poha'
        ];
        if (traditionalIndianTerms.some(term => foodName.includes(term)) || 
            foodCuisine === 'south_indian' || foodCuisine === 'north_indian' ||
            foodCategory === 'south_indian' || foodCategory === 'north_indian') {
          return false;
        }
      }

      // Allergen Exclusions
      for (const exclusion of activeExclusions) {
        if (exclusion === 'nuts') {
          // Exclude almond, peanut, nut, badam, moongfali
          const nutTerms = ['nut', 'almond', 'peanut', 'cashew', 'badam', 'moongfali'];
          if (nutTerms.some(term => foodDesc.includes(term))) {
            return false;
          }
        } else if (exclusion === 'dairy') {
          // Exclude curd, yogurt, milk, ghee, paneer, butter, cheese, cream, dahi, dudh
          const dairyTerms = ['milk', 'curd', 'yogurt', 'ghee', 'paneer', 'butter', 'cheese', 'cream', 'dahi', 'dudh', 'dairy'];
          if (dairyTerms.some(term => foodDesc.includes(term))) {
            return false;
          }
        } else if (exclusion === 'gluten') {
          // Exclude wheat items: roti, naan, bhature, paratha, chapati, oats, grain, semolina (upma), wheat
          const glutenTerms = ['roti', 'naan', 'bhature', 'paratha', 'chapati', 'wheat', 'samosa', 'upma'];
          if (glutenTerms.some(term => foodDesc.includes(term))) {
            return false;
          }
        } else if (exclusion.length > 0) {
          // Custom exclusion word check
          if (foodDesc.includes(exclusion)) {
            return false;
          }
        }
      }
      return true;
    });

    // If for some reason we filtered out EVERYTHING (safety fallback), restore a basic safe set
    if (allowedFoods.length === 0) {
      allowedFoods = allVerifiedFoods.filter(f => f.category === 'fruit' || f.category === 'vegetable');
    }

    const ai = getAI();

    if (!ai) {
      console.log('[AI Suggestions] No Gemini API key. Returning high-fidelity offline seeded response.');
      return res.json(getOfflineResponse());
    }

    // 4. Format allowed verified foods list for prompt insertion
    const allowedListString = allowedFoods.map(f => 
      `- ${f.name} (emoji: "${f.emoji}"): category="${f.category}", calories=${f.calories} kcal, protein=${f.protein}g, carbs=${f.carbs}g, fat=${f.fat}g, fiber=${f.fiber}g per serving (${f.servingLabel})`
    ).join('\n');

    // 5. Structure strict, bulletproof prompt
    const prompt = `You are the NutriTrack AI Advanced Nutrition Engine.
Create a highly professional and tailored meal plan for a user with the following targets:
- Calorie Target: ${calorieTarget} kcal
- Protein Target: ${proteinTarget} g
- Carb Target: ${carbsTarget} g
- Fat Target: ${fatTarget} g
- Cuisine Preference: ${cuisine} (South Indian / North Indian / Continental)
- Meals Per Day: ${mealsPerDay} meals

🚨 CRITICAL SAFETY RULES:
1. STRICT DATABASE LIMIT: You MUST select foods ONLY from the "VERIFIED FOOD LIST" below. Do NOT hallucinate, invent, or suggest any food, ingredient, or recipe that is not explicitly in this list. Every meal's "food" field must exactly match one of the food names from this list.
2. NO INGREDIENTS OR HALLUCINATED SIDES: If a dish like "Idli" is selected, the food field is "Idli". Do not add external toppings or ingredients not in the list.
3. SERVING CALCULATIONS: Adjust the "servings" field (e.g. 1, 1.5, 0.8, 2) to scale the calories and macros of the meal to meet the user's daily goals as closely as possible.
4. MEALS PER DAY COUNT: You must generate exactly ${mealsPerDay} meals.

SMART FEATURES (Only include these sections in response if requested):
- Grocery List ("groceryList" array in JSON): ${smartFeatures.groceryList ? 'Include exact ingredients and quantities needed' : 'Exclude (return empty array)'}
- Weekly Rotation ("weeklyRotation" array in JSON): ${smartFeatures.weeklyRotation ? 'Provide rotation ideas for alternate days' : 'Exclude (return empty array)'}
- AI Health Tips: ${smartFeatures.aiHealthTips ? 'YES' : 'NO'}
- Hydration Reminder: ${smartFeatures.hydrationReminder ? 'YES' : 'NO'}

VERIFIED FOOD LIST:
${allowedListString}

Return ONLY a valid JSON object matching this exact structure:
{
  "meals": [
    {
      "meal": "Breakfast",
      "food": "Exact name of food from list",
      "emoji": "Emoji of the food",
      "servings": 1.5,
      "calories": 250,
      "protein": 15,
      "carbs": 35,
      "fat": 5,
      "fiber": 4
    }
  ],
  "groceryList": ["item 1", "item 2"],
  "weeklyRotation": ["alternate option 1", "alternate option 2"],
  "tips": ["personalized health or hydration tip 1", "personalized health or hydration tip 2"],
  "macrosTotal": {
    "calories": 2000,
    "protein": 140,
    "carbs": 230,
    "fat": 58
  }
}

Do NOT output any markdown tags like \`\`\`json. Return pure raw JSON string only.`;

    const result = await generateContentWithFallback(prompt);
    let text = result.response.text().trim();
    // Clean up markdown block wraps if model adds them
    text = text.replace(/^```json/i, '').replace(/```$/i, '').trim();

    const plan = JSON.parse(text);
    res.json(plan);
  } catch (err) {
    console.error('[AI mealSuggestions error]', err);
    // In case of JSON parse error or Gemini failure, serve high-fidelity offline fallback
    try {
      console.log('[AI Suggestions Fallback] Triggering offline response due to error.');
      const offlinePlan = getOfflineResponse();
      res.json(offlinePlan);
    } catch (fallbackErr) {
      res.status(500).json({ error: 'Could not generate meal plan suggestions.' });
    }
  }
};

/* ─── POST /api/ai/workout-suggestions ──────────────────── */
exports.workoutSuggestions = async (req, res) => {
  try {
    const { goal = 'general', fitnessLevel = 'beginner', availableTime = 30 } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        exercises: [
          { name: 'Brisk Walking', duration: 15, caloriesBurned: 75, category: 'cardio' },
          { name: 'Push-ups', sets: 3, reps: 10, caloriesBurned: 30, category: 'strength' },
          { name: 'Plank', duration: 1, caloriesBurned: 5, category: 'core' },
        ],
        totalCalories: 110,
      });
    }

    const prompt = `${availableTime}min workout for goal=${goal}, level=${fitnessLevel}. JSON only: {"exercises":[{"name":"...","duration":10,"sets":null,"reps":null,"caloriesBurned":50,"category":"cardio"}],"totalCalories":200,"tips":["tip"]}`;
    const result = await generateContentWithFallback(prompt);
    let text = result.response.text().trim().replace(/```json?\n?/g, '').replace(/```/g, '');
    res.json(JSON.parse(text));
  } catch (err) {
    res.status(500).json({ error: 'Could not generate workout suggestions.' });
  }
};

/* ─── GET /api/ai/meal-plan ───────────────────────────────── */
exports.mealPlan = async (req, res) => {
  try {
    const ai = getAI();
    const user = req.user;
    
    // Default calorie goal fallback
    let calorieTarget = 2000;
    if (user.weight && user.height && user.age) {
      const bmr = user.gender === 'male'
        ? 88.36 + 13.4 * user.weight + 4.8 * user.height - 5.7 * user.age
        : 447.6  + 9.2  * user.weight + 3.1 * user.height - 4.3 * user.age;
      
      const activityFactors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
      const tdee = Math.round(bmr * (activityFactors[user.activityLevel] || 1.2));
      
      calorieTarget = user.goal === 'lose' ? tdee - 300 : user.goal === 'gain' ? tdee + 300 : tdee;
    }

    if (!ai) {
      return res.json({
        plan: `🤖 Google Gemini is offline (API key missing). Here is a personalized recommendation:\n\n**Calorie Target**: ${calorieTarget} kcal\n**Goal**: ${user.goal || 'maintain'}\n\n**Suggested Structure**:\n- **Breakfast**: Oatmeal, banana, & 2 boiled eggs (~25% of calories)\n- **Lunch**: Grilled chicken breast, brown rice, & broccoli (~35% of calories)\n- **Dinner**: Baked salmon, sweet potato, & mixed greens (~30% of calories)\n- **Snack**: Greek yogurt with almonds (~10% of calories)\n\nTip: Focus on whole, nutrient-dense foods and aim to hit 30% protein!`,
      });
    }

    const prompt = `Create a highly professional, beautifully formatted, personalized daily meal plan for a user with the following profile:
- Calorie Target: ${calorieTarget} kcal
- Goal: ${user.goal || 'maintain'}
- Weight: ${user.weight || 'unknown'} kg
- Height: ${user.height || 'unknown'} cm

Please format the response nicely with sections for Breakfast, Lunch, Dinner, and Snacks. Include calorie/macro estimates for each meal.`;
    
    const result = await generateContentWithFallback(prompt);
    res.json({ plan: result.response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate meal plan.' });
  }
};

/* ─── GET /api/ai/workout-plan ────────────────────────────── */
exports.workoutPlan = async (req, res) => {
  try {
    const ai = getAI();
    const user = req.user;

    if (!ai) {
      return res.json({
        plan: `🤖 Google Gemini is offline (API key missing). Here is a general workout suggestion:\n\n**Goal**: ${user.goal === 'lose' ? 'Fat Loss / Cardio' : user.goal === 'gain' ? 'Hypertrophy / Strength' : 'General Fitness'}\n\n**Suggested Routine**:\n1. **Warmup**: 5 mins dynamic stretches\n2. **Cardio/Strength**: 3 sets of Push-ups (10 reps), Bodyweight Squats (15 reps), and Plank (1 min)\n3. **Cooldown**: 5 mins static stretching\n\nStay active and log your exercises to stay on track!`,
      });
    }

    const prompt = `Create a personalized workout routine for a user with the following profile:
- Goal: ${user.goal || 'general fitness'}
- Activity Level: ${user.activityLevel || 'sedentary'}

Include a structured routine with a warm-up, main exercises (sets/reps/duration), and a cool-down. Make it clean, motivational, and easy to read.`;
    
    const result = await generateContentWithFallback(prompt);
    res.json({ plan: result.response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate workout plan.' });
  }
};

/* ─── POST /api/ai/scan-food ────────────────────────────── */
exports.scanFood = async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Image data and mimeType are required.' });
    }

    const ai = getAI();
    if (!ai) {
      // Offline fallback: simulate matching apple
      const fallbackFood = await Food.create({
        name: "Red Apple",
        emoji: "🍎",
        category: "fruit",
        servingSize: 100,
        servingUnit: "g",
        servingLabel: "1 medium apple (100g)",
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
        fiber: 2.4,
        isVerified: false
      });
      return res.json({ food: fallbackFood });
    }

    // Clean up base64 image data if data URI header is present
    let base64Data = image;
    if (image.includes(';base64,')) {
      base64Data = image.split(';base64,')[1];
    }
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    const prompt = `Identify the primary food item in this image. Estimate its nutritional value per standard serving size.
Return ONLY a valid JSON object matching the following structure (do not write markdown blocks or any additional text):

{
  "name": "concise food name (e.g., Chicken Salad, Masala Dosa)",
  "emoji": "a suitable emoji (e.g., 🥗, 🥞)",
  "category": "must be one of: fruit, vegetable, grain, dairy, protein, snack, beverage, south_indian, north_indian, indian_common, international, gym",
  "servingSize": number (estimate in grams/ml),
  "servingUnit": "unit (e.g., g, ml)",
  "servingLabel": "description (e.g., 1 plate (150g), 1 glass (250ml))",
  "calories": number (estimated kcal),
  "protein": number (estimated protein in grams),
  "carbs": number (estimated carbs in grams),
  "fat": number (estimated fat in grams),
  "fiber": number (estimated fiber in grams)
}

Note: Make sure all numeric values are numbers, not strings. JSON output:`;

    const result = await generateContentWithFallback(prompt, imagePart);
    const responseText = result.response.text();
    
    // Extract JSON safely
    let jsonText = responseText.trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const foodData = JSON.parse(jsonText);

    // Save to Food collection so it has a valid DB ID and can be favorited
    const savedFood = await Food.create({
      name: foodData.name || 'Scanned Meal',
      emoji: foodData.emoji || '🍽️',
      category: foodData.category || 'international',
      servingSize: Number(foodData.servingSize) || 100,
      servingUnit: foodData.servingUnit || 'g',
      servingLabel: foodData.servingLabel || '1 serving',
      calories: Number(foodData.calories) || 0,
      protein: Number(foodData.protein) || 0,
      carbs: Number(foodData.carbs) || 0,
      fat: Number(foodData.fat) || 0,
      fiber: Number(foodData.fiber) || 0,
      isVerified: false
    });

    res.json({ food: savedFood });
  } catch (err) {
    console.error('[AI scanFood]', err);
    res.status(500).json({ error: 'Failed to analyze food image: ' + err.message });
  }
};

/* ─── POST /api/ai/disease-recommendation ────────────────────────────── */
exports.generateDiseaseRecommendation = async (req, res) => {
  try {
    const { disease } = req.body;
    if (!disease) {
      return res.status(400).json({ error: 'Disease condition is required.' });
    }

    const ai = getAI();
    const user = req.user || {};

    // Check cache first to avoid burning Gemini quota
    const cacheKey = `${disease}_${user._id || 'anon'}`;
    const cached = diseaseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[AI Cache] Returning cached recommendation for ${disease}`);
      return res.json(cached.data);
    }

    const profile = `
- Age: ${user.age || 'Unknown'}
- Weight: ${user.weight ? user.weight + 'kg' : 'Unknown'}
- BMI: ${user.bmi || 'Unknown'}
- Activity Level: ${user.activityLevel || 'Unknown'}
- Goals: ${user.goal || 'Wellness'}
- Existing Conditions: ${disease}
`;

    if (!ai) {
      // Offline fallback
      return res.json({
        condition: disease,
        summary: `Fallback protocol for ${disease}. AI generation requires an API key.`,
        recommendedFoods: ["Eat leafy greens daily", "Include lean protein", "Snack on mixed nuts"],
        foodsToAvoid: ["Avoid processed sugars", "Limit trans fats", "Reduce excess sodium"],
        exercisePlan: ["Walk 30 minutes daily", "Consult your physician before intensive workouts"],
        hydrationSleep: ["Drink 2-3 Liters of water daily", "Aim for 7-8 hours of sleep"],
        stressManagement: ["Practice deep breathing for 5 minutes", "Try mindful meditation"],
        monitoringTips: ["Schedule regular health check-ups"],
        personalizedNote: "This is a generic fallback plan since the AI service is offline."
      });
    }

    const prompt = `You are an AI-powered health recommendation engine inside NutriTrack.

Your task is to generate VERY SHORT, CLEAN, and DISEASE-SPECIFIC recommendations.

Condition Selected: ${disease}

IMPORTANT RULES:
* Keep recommendations concise.
* Avoid long paragraphs.
* Use only key actionable points.
* Maximum 5–7 bullet points per section.
* Each bullet should be 1 short sentence only.
* Do NOT explain too much.
* Avoid medical essays.
* Recommendations must still be UNIQUE for every disease.

## User Profile
Use this to personalize recommendations:
${profile}

## Disease-Specific Intelligence Guidelines
- Diabetes: Focus on low glycemic foods, blood sugar stabilization, fiber, controlled carbs, walking after meals. Avoid sugary foods, soda, processed sugar.
- Hypertension: Focus on low sodium, heart-friendly, potassium-rich, stress reduction. Avoid processed foods, chips, excess salt.
- High Cholesterol: Focus on reducing LDL, increasing HDL, omega-3, soluble fiber. Avoid fried foods, trans fats.
- Obesity: Focus on calorie deficit, high protein, fat-burning, portion control. Avoid fast food, sugary drinks, refined carbs.
- Anemia: Focus on iron-rich, vitamin C absorption. Avoid tea/coffee immediately after meals.
- Hypothyroidism: Focus on metabolism support, selenium, iodine. Avoid excess soy, ultra-processed foods.
- Hyperthyroidism: Focus on calorie stabilization, muscle preservation, avoid overstimulation (caffeine/spicy).
- PCOS: Focus on hormonal balance, insulin resistance, anti-inflammatory. Avoid sugary foods, processed carbs.
- Asthma: Focus on anti-inflammatory, breathing support. Avoid allergens, sulfites.
- Anxiety / Stress: Focus on nervous system calming, sleep, magnesium. Avoid excess caffeine/alcohol.
- Insomnia: Focus on sleep cycle, melatonin support. Avoid late caffeine, screen exposure.

Return ONLY a valid JSON object matching this exact structure:
{
  "condition": "${disease}",
  "summary": "2-3 lines maximum overview",
  "recommendedFoods": ["Short point (max 15 words)", "Short point"],
  "foodsToAvoid": ["Short point (max 15 words)", "Short point"],
  "exercisePlan": ["Short point (max 15 words)", "Short point"],
  "hydrationSleep": ["Short point (max 15 words)", "Short point"],
  "stressManagement": ["Short point (max 15 words)", "Short point"],
  "monitoringTips": ["Short point (max 15 words)", "Short point"],
  "personalizedNote": "2 lines maximum"
}

LENGTH LIMITS:
- Summary: Maximum 2–3 short lines.
- Each Recommendation Point: Maximum 12–15 words.
- recommendedFoods: Max 6 points
- foodsToAvoid: Max 5 points
- exercisePlan: Max 4 points
- stressManagement: Max 4 points
- monitoringTips: Max 4 points

FINAL IMPORTANT RULE:
NEVER reuse identical outputs for different diseases. Each disease must have different foods, avoid lists, exercise plans, lifestyle advice, and monitoring tips.

Do NOT wrap the output in markdown code blocks like \`\`\`json. Return pure JSON.`;

    const result = await generateContentWithFallback(prompt);
    let text = result.response.text().trim();
    // Strip markdown formatting if AI still outputs it
    text = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(text);
    } catch (parseErr) {
      console.error('Failed to parse AI disease recommendation:', text);
      throw new Error('AI returned malformed JSON.');
    }

    res.json(aiResponse);

    // Store in cache
    diseaseCache.set(cacheKey, { data: aiResponse, timestamp: Date.now() });
    console.log(`[AI Cache] Cached recommendation for ${disease}`);
  } catch (err) {
    console.error('[AI diseaseRecommendation]', err);
    res.status(500).json({ error: 'Could not generate disease recommendation.' });
  }
};

