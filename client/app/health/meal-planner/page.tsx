'use client';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Utensils, Sparkles, Edit3, Check, Activity, Droplets, Moon, HeartPulse, RefreshCw, AlertCircle, ShoppingBag, Calendar, Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const CUISINE_OPTIONS = [
  { id: 'south_indian', label: 'South Indian' },
  { id: 'north_indian', label: 'North Indian' },
  { id: 'continental', label: 'Continental' },
];

const HEALTH_CONDITIONS = ['None', 'Diabetes', 'Hypertension', 'High Cholesterol', 'PCOS', 'Kidney Disease'];

const ALLERGY_PRESETS = ['Nuts', 'Dairy', 'Gluten', 'Soy', 'Seafood', 'Eggs'];

const SMART_FEATURES = [
  { key: 'groceryList', label: 'Grocery List', defaultOn: true },
  { key: 'weeklyRotation', label: 'Weekly Rotation', defaultOn: true },
  { key: 'macroTracking', label: 'Macro Tracking', defaultOn: true },
  { key: 'aiHealthTips', label: 'AI Health Tips', defaultOn: true },
  { key: 'hydrationReminder', label: 'Hydration Reminder', defaultOn: true },
];

interface MealItem {
  meal: string;
  food: string;
  emoji: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

interface GeneratedPlan {
  meals: MealItem[];
  groceryList: string[];
  weeklyRotation: string[];
  tips: string[];
  macrosTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  offline?: boolean;
}

interface DiseaseRecommendation {
  condition: string;
  summary: string;
  recommendedFoods: string[];
  foodsToAvoid: string[];
  exercisePlan: string[];
  hydrationSleep: string[];
  stressManagement: string[];
  monitoringTips: string[];
  personalizedNote: string;
}

export default function MealPlannerApp() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'planner' | 'tracker' | 'disease'>('planner');

  // Preferences State
  const [healthCondition, setHealthCondition] = useState<string>('None');
  const [dietaryPreference, setDietaryPreference] = useState('Vegetarian');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [cuisinePreference, setCuisinePreference] = useState('south_indian');
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [smartFeatures, setSmartFeatures] = useState<Record<string, boolean>>({
    groceryList: true,
    weeklyRotation: true,
    macroTracking: true,
    aiHealthTips: true,
    hydrationReminder: true,
  });

  // Health Metrics State
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [weightKg, setWeightKg] = useState<number>(user?.weight || 70);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [metricSuccess, setMetricSuccess] = useState('');

  // AI Plan State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [planError, setPlanError] = useState('');

  // Disease AI State
  const [selectedDisease, setSelectedDisease] = useState('Diabetes');
  const [loadingDisease, setLoadingDisease] = useState(false);
  const [diseaseData, setDiseaseData] = useState<DiseaseRecommendation | null>(null);

  // Fetch initial summary from backend
  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await api.get('/health');
        if (res.data) {
          setWaterGlasses(res.data.waterGlasses || 0);
        }
      } catch (err) {
        console.warn('Backend offline or unauthorized, using local defaults');
      }
    }
    loadSummary();
  }, []);

  const personalStats = useMemo(() => [
    { label: 'Age', value: user?.age ? `${user.age} yrs` : '25 yrs', icon: '🧬' },
    { label: 'Weight', value: `${weightKg} kg`, icon: '⚖️' },
    { label: 'Height', value: user?.height ? `${user.height} cm` : '175 cm', icon: '📏' },
    { label: 'Goal', value: user?.goal ?? 'Balanced', icon: '🎯' },
    { label: 'Activity', value: user?.activityLevel ?? 'Moderate', icon: '⚡' },
  ], [user, weightKg]);

  const targetMacros = useMemo(() => {
    const baseCalories = user?.calorieGoal ?? Math.max(1400, Math.round(weightKg * 25));
    let calories = baseCalories;

    if (healthCondition === 'Diabetes') calories -= 100;
    if (healthCondition === 'High Cholesterol') calories -= 50;

    let protein = Math.round((calories * 0.28) / 4);
    let carbs = Math.round((calories * 0.48) / 4);
    let fat = Math.round((calories * 0.24) / 9);

    return { calories, protein, carbs, fat, water: '3-4 Liters' };
  }, [user, weightKg, healthCondition]);

  // Handle Water Logging
  const updateWater = async (delta: number) => {
    const nextVal = Math.max(0, waterGlasses + delta);
    setWaterGlasses(nextVal);
    try {
      await api.post('/health/water', { waterGlasses: nextVal });
    } catch (err) {
      console.warn('Failed to persist water to server');
    }
  };

  // Handle Real AI Meal Suggestion Call
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setPlanError('');
    setGeneratedPlan(null);

    try {
      const res = await api.post('/ai/meal-suggestions', {
        cuisine: cuisinePreference,
        mealsPerDay,
        allergies,
        customAllergy,
        smartFeatures,
        targets: targetMacros,
        dietaryPreference,
      });

      setGeneratedPlan(res.data);
    } catch (err: any) {
      console.error('Failed to generate AI plan:', err);
      setPlanError('Could not connect to AI service. Please make sure backend is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Real Disease Recommendation Call
  const fetchDiseaseInfo = async (condition: string) => {
    setSelectedDisease(condition);
    setLoadingDisease(true);
    setDiseaseData(null);
    try {
      const res = await api.post('/ai/disease-recommendation', { disease: condition });
      setDiseaseData(res.data);
    } catch (err) {
      console.error('Disease AI error:', err);
    } finally {
      setLoadingDisease(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white pb-24">
      {/* Background glowing ambient light */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute bottom-20 left-10 w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Navigation Header Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight flex items-center gap-3">
              <Sparkles className="text-purple-400" size={28} /> Health & AI Nutrition
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Personalized AI diet plans using verified food dataset & real-time metric tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'planner'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🥗 AI Diet Planner
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'tracker'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💧 Daily Metrics
            </button>
            <button
              onClick={() => {
                setActiveTab('disease');
                if (!diseaseData) fetchDiseaseInfo(selectedDisease);
              }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'disease'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🩺 Disease Advisor
            </button>
          </div>
        </div>

        {/* Minimal User Profile Row */}
        <div className="flex flex-wrap gap-6 items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
          <div className="flex flex-wrap gap-8 items-center">
            {personalStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="text-2xl p-2 rounded-xl bg-white/5 border border-white/5">{stat.icon}</div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{stat.label}</p>
                  <p className="text-base font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAB 1: AI DIET PLANNER */}
        {activeTab === 'planner' && (
          <div className="space-y-8">
            {/* Customization Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* BLOCK A: Cuisine & Meals */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Utensils size={18} className="text-purple-400" /> Diet, Cuisine & Frequency
                </h3>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-3">Dietary Preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Vegetarian', 'Non-Vegetarian', 'Vegan'].map((diet) => (
                      <button
                        key={diet}
                        onClick={() => setDietaryPreference(diet)}
                        className={`py-2.5 px-2 rounded-xl text-[11px] font-bold transition text-center ${
                          dietaryPreference === diet
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {diet}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-3">Cuisine Style</label>
                  <div className="flex flex-col gap-2">
                    {CUISINE_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCuisinePreference(c.id)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                          cuisinePreference === c.id
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <span>{c.label}</span>
                        {cuisinePreference === c.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-3">Daily Meal Routine</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { count: 4, label: '4 Meals (Full Routine)' },
                      { count: 3, label: '3 Meals (Standard)' },
                    ].map((item) => (
                      <button
                        key={item.count}
                        onClick={() => setMealsPerDay(item.count)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition text-center ${
                          mealsPerDay === item.count
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* BLOCK B: Health Conditions & Allergies */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HeartPulse size={18} className="text-pink-400" /> Medical & Allergies
                </h3>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-2">Health Condition</label>
                  <select
                    value={healthCondition}
                    onChange={(e) => setHealthCondition(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                  >
                    {HEALTH_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond} className="bg-[#090d16] text-white">{cond}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-2">Allergies & Exclusions</label>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ALLERGY_PRESETS.map((allergen) => (
                      <button
                        key={allergen}
                        onClick={() => {
                          setAllergies((prev) =>
                            prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
                          );
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          allergies.includes(allergen)
                            ? 'bg-pink-600 text-white'
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={customAllergy}
                      onChange={(e) => setCustomAllergy(e.target.value)}
                      placeholder="Custom food to avoid..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-gray-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCK C: Smart AI Options */}
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400" /> Smart AI Outputs
                </h3>

                <div className="space-y-2">
                  {SMART_FEATURES.map((feature) => (
                    <button
                      key={feature.key}
                      onClick={() =>
                        setSmartFeatures((prev) => ({ ...prev, [feature.key]: !prev[feature.key] }))
                      }
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition"
                    >
                      <span className="text-xs font-medium text-gray-300">{feature.label}</span>
                      <div
                        className={`w-8 h-4 rounded-full p-0.5 transition ${
                          smartFeatures[feature.key] ? 'bg-emerald-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`h-3 w-3 rounded-full bg-white transition ${
                            smartFeatures[feature.key] ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Macros Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-purple-400">Target Calories</p>
                <p className="text-2xl font-black text-white mt-1">{targetMacros.calories} <span className="text-xs text-purple-300">kcal</span></p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Target Protein</p>
                <p className="text-2xl font-black text-white mt-1">{targetMacros.protein} <span className="text-xs text-emerald-300">g</span></p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-blue-400">Target Carbs</p>
                <p className="text-2xl font-black text-white mt-1">{targetMacros.carbs} <span className="text-xs text-blue-300">g</span></p>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-amber-400">Target Fat</p>
                <p className="text-2xl font-black text-white mt-1">{targetMacros.fat} <span className="text-xs text-amber-300">g</span></p>
              </div>
            </div>

            {/* Generate CTA Button */}
            <div className="flex justify-center pt-2">
              <button
                disabled={isGenerating}
                onClick={handleGeneratePlan}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:scale-105 transition-all text-white font-extrabold shadow-xl shadow-purple-900/30 flex items-center gap-3 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    <span>Querying Gemini AI Dataset Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Generate Realistic AI Diet Plan</span>
                  </>
                )}
              </button>
            </div>

            {planError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3 justify-center">
                <AlertCircle size={18} /> {planError}
              </div>
            )}

            {/* Render Real Generated Plan */}
            {generatedPlan && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Check size={20} className="text-emerald-400" />
                    <span className="font-bold">AI Diet Plan Generated (Strict Verified Dataset)</span>
                  </div>
                  {generatedPlan.offline && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold">Verified Offline Dataset Mode</span>
                  )}
                </div>

                {/* Grouped Section-Wise Meals Display */}
                <div className="space-y-6">
                  {(() => {
                    const sectionOrder = ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'];
                    const sectionConfigs: Record<string, { icon: string; time: string; title: string; desc: string; color: string }> = {
                      'Breakfast': {
                        icon: '🌅',
                        time: '8:00 AM - 9:00 AM',
                        title: 'Breakfast Section',
                        desc: 'Morning Fuel & Metabolism Kickstart',
                        color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30'
                      },
                      'Lunch': {
                        icon: '☀️',
                        time: '1:00 PM - 2:00 PM',
                        title: 'Lunch Section',
                        desc: 'Mid-Day Protein & Sustained Energy',
                        color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30'
                      },
                      'Evening Snack': {
                        icon: '☕',
                        time: '5:00 PM - 5:30 PM',
                        title: 'Evening Snack Section',
                        desc: 'Refuel & Anti-Catabolic Snack',
                        color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30'
                      },
                      'Dinner': {
                        icon: '🌙',
                        time: '8:00 PM - 9:00 PM',
                        title: 'Dinner Section',
                        desc: 'Light Evening Recovery & Overnight Repair',
                        color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30'
                      }
                    };

                    const sections = sectionOrder.map((sectionName) => {
                      const items = generatedPlan.meals.filter((m) => m.meal === sectionName);
                      return { sectionName, items };
                    }).filter((sec) => sec.items.length > 0);

                    // If any custom section names exist that are not in sectionOrder, add them
                    const existingNames = new Set(sectionOrder);
                    generatedPlan.meals.forEach((m) => {
                      if (!existingNames.has(m.meal)) {
                        sections.push({ sectionName: m.meal, items: [m] });
                        existingNames.add(m.meal);
                      }
                    });

                    return sections.map((sec, secIdx) => {
                      const config = sectionConfigs[sec.sectionName] || {
                        icon: '🍽️',
                        time: `Meal Section ${secIdx + 1}`,
                        title: `${sec.sectionName} Section`,
                        desc: 'Target Nutrition',
                        color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30'
                      };

                      const secCals = sec.items.reduce((sum, item) => sum + item.calories, 0);
                      const secProt = Number(sec.items.reduce((sum, item) => sum + item.protein, 0).toFixed(1));
                      const secCarbs = Number(sec.items.reduce((sum, item) => sum + item.carbs, 0).toFixed(1));
                      const secFat = Number(sec.items.reduce((sum, item) => sum + item.fat, 0).toFixed(1));

                      return (
                        <div key={sec.sectionName} className={`p-6 rounded-2xl bg-gradient-to-r ${config.color} border backdrop-blur-md space-y-5 shadow-xl`}>
                          {/* Section Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl p-2.5 rounded-2xl bg-white/10 border border-white/10">{config.icon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-purple-300 border border-white/10">
                                    {config.time}
                                  </span>
                                  <h3 className="text-xl font-extrabold text-white tracking-wide">{config.title}</h3>
                                </div>
                                <p className="text-xs text-gray-300 mt-0.5">{config.desc} ({sec.items.length} items)</p>
                              </div>
                            </div>

                            {/* Combined Section Macro Totals */}
                            <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                              <span className="text-purple-300 font-extrabold">{secCals} kcal</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-emerald-300">{secProt}g Protein</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-blue-300">{secCarbs}g Carbs</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-amber-300">{secFat}g Fat</span>
                            </div>
                          </div>

                          {/* Food Items Inside This Section */}
                          <div className={`grid ${sec.items.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                            {sec.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-purple-400/40 transition space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl p-1.5 rounded-lg bg-white/5">{item.emoji || '🍽️'}</span>
                                    <div>
                                      <h4 className="text-base font-extrabold text-white">{item.food}</h4>
                                      <p className="text-xs text-purple-300/80 font-medium">Serving: {item.servings}x portion</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-1.5 pt-2 text-center text-xs border-t border-white/5">
                                  <div className="p-1.5 rounded-lg bg-white/5">
                                    <p className="text-[9px] font-bold text-gray-400">KCAL</p>
                                    <p className="font-extrabold text-purple-300">{item.calories}</p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-white/5">
                                    <p className="text-[9px] font-bold text-gray-400">PROT</p>
                                    <p className="font-extrabold text-emerald-300">{item.protein}g</p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-white/5">
                                    <p className="text-[9px] font-bold text-gray-400">CARB</p>
                                    <p className="font-extrabold text-blue-300">{item.carbs}g</p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-white/5">
                                    <p className="text-[9px] font-bold text-gray-400">FAT</p>
                                    <p className="font-extrabold text-amber-300">{item.fat}g</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Grocery & Rotation Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  {generatedPlan.groceryList && generatedPlan.groceryList.length > 0 && (
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <ShoppingBag size={18} className="text-purple-400" /> Grocery List
                      </h4>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        {generatedPlan.groceryList.map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="text-purple-400">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedPlan.tips && generatedPlan.tips.length > 0 && (
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <Lightbulb size={18} className="text-emerald-400" /> AI Health & Hydration Tips
                      </h4>
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        {generatedPlan.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* TAB 2: DAILY METRICS TRACKER */}
        {activeTab === 'tracker' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Water Tracker Card */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Droplets className="text-blue-400" size={22} /> Hydration Tracker
                </h3>
                <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-full">
                  Target: 8-12 Glasses
                </span>
              </div>

              <div className="flex items-center justify-center gap-6 py-4">
                <button
                  onClick={() => updateWater(-1)}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-2xl font-bold hover:bg-white/10 text-gray-300"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="text-5xl font-black text-blue-400">{waterGlasses}</span>
                  <p className="text-xs text-gray-400 mt-1">glasses (~{(waterGlasses * 250 / 1000).toFixed(1)} L)</p>
                </div>
                <button
                  onClick={() => updateWater(1)}
                  className="w-12 h-12 rounded-full bg-blue-600 text-2xl font-bold hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                >
                  +
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Drinking 250ml every 2 hours keeps your metabolism and digestion optimal.
              </p>
            </div>

            {/* Sleep & Quality Card */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Moon className="text-indigo-400" size={22} /> Sleep Duration & Quality
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-400">Sleep Duration</span>
                    <span className="text-indigo-300">{sleepHours} Hours</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-400 block mb-2">Sleep Quality</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSleepQuality(star)}
                        className={`flex-1 py-2 rounded-xl text-lg font-bold transition ${
                          sleepQuality >= star ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-500'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DISEASE ADVISOR */}
        {activeTab === 'disease' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 items-center">
              {['Diabetes', 'Hypertension', 'High Cholesterol', 'PCOS', 'Obesity', 'Anxiety / Stress'].map((dis) => (
                <button
                  key={dis}
                  onClick={() => fetchDiseaseInfo(dis)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    selectedDisease === dis
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {dis}
                </button>
              ))}
            </div>

            {loadingDisease && (
              <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-3">
                <RefreshCw className="animate-spin text-purple-400" size={20} />
                <span>Generating AI Medical Nutrition Plan...</span>
              </div>
            )}

            {diseaseData && !loadingDisease && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    🩺 AI Guidance for {diseaseData.condition}
                  </h3>
                  <p className="text-xs text-purple-200/80 leading-relaxed">{diseaseData.summary}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                    <h4 className="font-bold text-emerald-400 text-sm">✔ Recommended Foods</h4>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {diseaseData.recommendedFoods?.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
                    <h4 className="font-bold text-red-400 text-sm">✘ Foods to Avoid</h4>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {diseaseData.foodsToAvoid?.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
