const { GoogleGenerativeAI } = require('@google/generative-ai');
const Meal = require('../models/Meal');
const HealthMetric = require('../models/HealthMetric');
const Workout = require('../models/Workout');

let genAI;
const getAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GENERATIVE_AI_API_KEY;
    if (key) genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
};

// 🛠️ COPILOT SYSTEM TOOL DEFINITIONS
const copilotTools = [
  {
    functionDeclarations: [
      {
        name: 'get_dashboard_data',
        description: 'Retrieves today\'s statistics (calories consumed, protein, carbs, fat, and water glasses) and recent days calorie consumption history.',
      },
      {
        name: 'log_meal',
        description: 'Logs a new meal eaten by the user with dynamic calories, protein, carbs, fat, and a custom meal name.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'The name of the meal (e.g. Chicken Avocado Salad, Protein Pancake).' },
            totalCalories: { type: 'NUMBER', description: 'Total calories of the meal in kcal.' },
            totalProtein: { type: 'NUMBER', description: 'Total protein in grams.' },
            totalCarbs: { type: 'NUMBER', description: 'Total carbohydrates in grams.' },
            totalFat: { type: 'NUMBER', description: 'Total fats in grams.' }
          },
          required: ['name', 'totalCalories']
        }
      },
      {
        name: 'add_water',
        description: 'Adds a specified number of water glasses to the user\'s daily log.',
        parameters: {
          type: 'OBJECT',
          properties: {
            glasses: { type: 'NUMBER', description: 'Number of glasses of water to add.' }
          },
          required: ['glasses']
        }
      },
      {
        name: 'add_workout',
        description: 'Logs a new physical exercise or workout performed by the user to their daily logs.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'The name of the workout or exercise (e.g., Treadmill Run, Bench Press).' },
            duration: { type: 'NUMBER', description: 'Duration of the exercise in minutes.' },
            caloriesBurned: { type: 'NUMBER', description: 'Estimated calories burned during this exercise.' },
            category: { type: 'STRING', description: 'Optional workout category: cardio, strength, or flexibility.' },
            notes: { type: 'STRING', description: 'Optional workout notes or details.' }
          },
          required: ['name', 'duration', 'caloriesBurned']
        }
      },
      {
        name: 'get_user_profile',
        description: 'Retrieves the user\'s profile details, such as weight, height, age, activity level, gender, and goal.'
      }
    ]
  }
];

// Helper methods to execute database tools
async function executeGetDashboardData(userId) {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = await Meal.find({ userId, date: todayStr });
  const todayNutrition = todayMeals.reduce((acc, m) => {
    acc.totalCalories += m.totalCalories || 0;
    acc.totalProtein += m.totalProtein || 0;
    acc.totalCarbs += m.totalCarbs || 0;
    acc.totalFat += m.totalFat || 0;
    return acc;
  }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, water: 0 });

  const todayHealth = await HealthMetric.findOne({ userId, date: todayStr });
  todayNutrition.water = todayHealth?.waterGlasses || 0;

  return {
    todayNutrition,
    todayDate: todayStr,
    message: "Dashboard stats retrieved successfully."
  };
}

async function executeLogMeal(userId, args) {
  const todayStr = new Date().toISOString().split('T')[0];
  const newMeal = await Meal.create({
    userId,
    date: todayStr,
    name: args.name,
    totalCalories: Number(args.totalCalories),
    totalProtein: Number(args.totalProtein || 0),
    totalCarbs: Number(args.totalCarbs || 0),
    totalFat: Number(args.totalFat || 0),
    items: [{
      name: args.name,
      calories: Number(args.totalCalories),
      protein: Number(args.totalProtein || 0),
      carbs: Number(args.totalCarbs || 0),
      fat: Number(args.totalFat || 0)
    }]
  });
  return {
    success: true,
    meal: newMeal,
    message: `Meal '${args.name}' of ${args.totalCalories} kcal logged successfully.`
  };
}

async function executeAddWater(userId, glasses) {
  const todayStr = new Date().toISOString().split('T')[0];
  const metric = await HealthMetric.findOneAndUpdate(
    { userId, date: todayStr },
    { $inc: { waterGlasses: Number(glasses) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return {
    success: true,
    totalGlasses: metric.waterGlasses,
    message: `${glasses} glasses of water added. Daily total: ${metric.waterGlasses} glasses.`
  };
}

async function executeAddWorkout(userId, args) {
  const todayStr = new Date().toISOString().split('T')[0];
  const newWorkout = await Workout.create({
    userId,
    date: todayStr,
    name: args.name,
    exercises: [{
      name: args.name,
      category: args.category || 'cardio',
      duration: Number(args.duration),
      caloriesBurned: Number(args.caloriesBurned),
      notes: args.notes
    }],
    notes: args.notes
  });
  return {
    success: true,
    workout: newWorkout,
    message: `Workout '${args.name}' (${args.duration}m, ${args.caloriesBurned} kcal burned) logged successfully.`
  };
}

async function executeGetUserProfile(user) {
  return {
    name: user.name,
    weight: user.weight,
    height: user.height,
    age: user.age,
    gender: user.gender,
    activityLevel: user.activityLevel,
    goal: user.goal,
    message: "Profile settings retrieved successfully."
  };
}

const COPILOT_SYSTEM_PROMPT = `You are NutriCopilot, the intelligent personal assistant and command center built directly inside the NutriTrack application.
Your role is to help users manage their health workflows, perform automated actions, and retrieve dashboard insights using internal application data.

You have access to powerful local system tools. You must call these tools whenever a user asks to view stats, log foods, add water, log workouts, or inspect profile details.

CRITICAL OPERATIONAL RULES:
1. **Prioritize App Data**: Always prioritize application data returned by tools over general knowledge.
2. **Execute Actions Promptly**: Use tools immediately when an action or data query is requested.
3. **No Hallucinations**: Never invent, hallucinate, or assume user metrics, logs, or dashboard data. If a tool has not returned it, it does not exist in the database.
4. **Tool Mapping**: If a user asks to perform an action (e.g. "log a salad" or "add a glass of water"), identify the correct tool, call it, and confirm the exact result to the user.
5. **Clear Confirmation**: When a tool executes successfully, confirm the action clearly and state the details (e.g. "Logged 350 kcal Chicken Salad for today!").
6. **Follow-up for Missing Parameters**: If a user asks for an action but crucial data is missing (e.g. they say "log my breakfast" but do not provide what they ate or how many calories), ask friendly follow-up questions to gather the missing fields!
7. **Behave like an Internal App Assistant**: Speak with authority, efficiency, and context as an organic part of the NutriTrack dashboard, not as a general public chatbot.
`;

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const ai = getAI();
    if (!ai) {
      return res.json({
        reply: "🤖 NutriCopilot requires a valid Gemini API key. Please check your environment configurations.",
        executedTools: []
      });
    }

    // Set up chat session with history and tools integrated!
    const chatHistory = [
      { role: 'user',  parts: [{ text: COPILOT_SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Greetings, Commander. NutriCopilot online. Ready to access dashboard databases and execute workflow commands.' }] },
      ...history.slice(-10).map((h) => ({
        role:  h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
    ];

    const modelName = 'gemini-2.5-flash';
    console.log(`[Copilot] Starting generation session with model: ${modelName}`);
    const model = ai.getGenerativeModel({ 
      model: modelName,
      tools: copilotTools
    });

    const chat = model.startChat({ history: chatHistory });
    let response = await chat.sendMessage(message);

    let functionCalls = response.response.functionCalls;
    let executedTools = [];
    let reply = "";

    if (functionCalls && functionCalls.length > 0) {
      const toolResponses = [];
      for (const call of functionCalls) {
        const { name, args } = call;
        console.log(`[Copilot Tool Invocation] Running tool: ${name} with args:`, args);
        
        let toolResult;
        try {
          if (name === 'get_dashboard_data') {
            toolResult = await executeGetDashboardData(req.user._id);
          } else if (name === 'log_meal') {
            toolResult = await executeLogMeal(req.user._id, args);
          } else if (name === 'add_water') {
            toolResult = await executeAddWater(req.user._id, args.glasses);
          } else if (name === 'add_workout') {
            toolResult = await executeAddWorkout(req.user._id, args);
          } else if (name === 'get_user_profile') {
            toolResult = await executeGetUserProfile(req.user);
          } else {
            toolResult = { error: 'Requested tool not available' };
          }
          executedTools.push({ name, args, success: !toolResult.error, result: toolResult });
        } catch (err) {
          console.error(`[Copilot Tool Failure] Tool ${name} failed:`, err.message);
          toolResult = { error: err.message };
          executedTools.push({ name, args, success: false, result: toolResult });
        }

        toolResponses.push({
          functionResponse: {
            name: name,
            response: toolResult
          }
        });
      }

      // Send execution responses back to model to synthesize the final response
      console.log(`[Copilot] Feeding tool responses back to model...`);
      const finalResult = await chat.sendMessage(toolResponses);
      reply = finalResult.response.text();
    } else {
      reply = response.response.text();
    }

    res.json({ reply, executedTools });
  } catch (err) {
    console.error('[Copilot Controller]', err);
    res.status(500).json({ error: 'Copilot service error: ' + err.message });
  }
};
