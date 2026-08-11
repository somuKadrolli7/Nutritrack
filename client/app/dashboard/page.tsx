'use client';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { calcBMI, calcBMR, calcTDEE, bmiCategory, getCalorieGoal, todayStr } from '@/lib/utils';

const SLOT_META: Record<string, { icon: string; label: string }> = {
  breakfast: { icon: '🌅', label: 'Breakfast' },
  lunch:     { icon: '☀️',  label: 'Lunch' },
  dinner:    { icon: '🌙', label: 'Dinner' },
  snack:     { icon: '🍎', label: 'Snack' },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [water, setWater] = useState(0);
  const [meals, setMeals] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const loadMeals = async () => {
    try {
      const res = await api.get(`/meals?date=${todayStr()}`);
      setMeals(res.data.meals ?? []);
    } catch (e) {
      console.error('loadMeals error', e);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await api.delete(`/meals/${id}`);
      await loadMeals();
      // Instantly reload stats
      const { data: dData } = await api.get('/dashboard');
      setData(dData);
    } catch (e) {
      console.error('deleteMeal error', e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: dData } = await api.get('/dashboard');
        setData(dData);
        setWater(dData.todayNutrition?.water || 0);
      } catch (e: any) {
        console.error(e);
        setError(e.response?.data?.error || 'Failed to load dashboard data.');
      }
    };
    fetchData();
    loadMeals();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !data) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.dash-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [data]);

  useEffect(() => {
    if (data && ringRef.current && user) {
      const goal = getCalorieGoal(user);
      const consumed = data.todayNutrition?.totalCalories || 0;
      const pct = Math.min(100, Math.max(0, (consumed / goal) * 100));
      const dashOffset = 440 - (440 * pct) / 100;
      
      gsap.fromTo(ringRef.current, 
        { strokeDashoffset: 440 },
        { strokeDashoffset: dashOffset, duration: 1.5, ease: 'power3.out', delay: 0.3 }
      );

      gsap.fromTo('.stat-num',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.2 }
      );

      gsap.fromTo('.macro-bar > div',
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: 'power3.out', transformOrigin: 'left center', stagger: 0.1 }
      );

      gsap.fromTo('.hydration-button',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.6)' }
      );

      if (chartRef.current) {
        gsap.fromTo(chartRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.2 }
        );
      }
    }
  }, [data, user]);

  if (!user) return null;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-4 animate-spin inline-block text-purple-500">⚡</div>
        <p className="text-gray-400 font-medium">Loading your stats...</p>
      </div>
    );
  }

  const currentWeight = user.weight || 0;
  const bmi = calcBMI(currentWeight, user.height || 0);
  const bmr = calcBMR(currentWeight, user.height || 0, user.age || 0, user.gender || 'male');
  const tdee = calcTDEE(bmr, user.activityLevel || 'sedentary');
  const cat = bmiCategory(bmi);
  const calGoal = getCalorieGoal(user);
  
  const consumed = data.todayNutrition?.totalCalories || 0;
  const calPct = Math.round((consumed / calGoal) * 100);

  // Macro calculations
  const pGoal = Math.round((calGoal * 0.3) / 4);
  const cGoal = Math.round((calGoal * 0.4) / 4);
  const fGoal = Math.round((calGoal * 0.3) / 9);
  
  const pCon = data.todayNutrition?.totalProtein || 0;
  const cCon = data.todayNutrition?.totalCarbs || 0;
  const fCon = data.todayNutrition?.totalFat || 0;

  const getPct = (c: number, g: number) => Math.min(100, (c / (g || 1)) * 100);

  const toggleWater = async (idx: number) => {
    const newWater = idx + 1 === water ? idx : idx + 1;
    setWater(newWater);
    try {
      await api.post('/nutrition', { items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, water: newWater });
    } catch {}
  };

  // Chart Data preparation
  const chartData = data.recentNutrition?.slice(-7).map((n: any) => ({
    name: new Date(n.date).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: n.totalCalories
  })) || [];

  const grouped = ['breakfast','lunch','dinner','snack'].map(slot => ({
    slot, items: meals.filter(m => m.mealType === slot),
  }));

  return (
    <div ref={containerRef} className="flex flex-col gap-6 pb-12 text-white">
      
      {/* ROW 1: Welcome Banner */}
      <div className="dash-card flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 to-[#111118] border border-purple-500/20">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit']">Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-400 mt-1">Let's crush your fitness goals today.</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="px-4 py-2 rounded-full bg-black/30 border border-white/5 flex items-center gap-2">
            <span className="text-purple-400">⚡</span>
            <span className="font-bold">{calGoal} kcal Target</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-black/30 border border-white/5 flex items-center gap-2">
            <span className="text-orange-400">🔥</span>
            <span className="font-bold">{user.streak || 0} Day Streak</span>
          </div>
        </div>
      </div>

      {/* ROW 2: 4-Column Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="dash-card bg-[#111118] p-5 rounded-2xl border border-white/5 hover:border-teal-500/30 transition-colors">
          <div className="text-gray-400 font-medium mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500"/> BMI</div>
          <div className="text-3xl font-bold text-teal-400 stat-num">{bmi || '—'}</div>
          <div className="text-sm text-gray-500 mt-1">{cat.label}</div>
        </div>
        
        <div className="dash-card bg-[#111118] p-5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-colors">
          <div className="text-gray-400 font-medium mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"/> BMR</div>
          <div className="text-3xl font-bold text-orange-400 stat-num">{bmr}</div>
          <div className="text-sm text-gray-500 mt-1">kcal/day basal</div>
        </div>

        <div className="dash-card bg-[#111118] p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors">
          <div className="text-gray-400 font-medium mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"/> TDEE</div>
          <div className="text-3xl font-bold text-purple-400 stat-num">{tdee}</div>
          <div className="text-sm text-gray-500 mt-1">kcal/day active</div>
        </div>

        <div className="dash-card bg-[#111118] p-5 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-colors">
          <div className="text-gray-400 font-medium mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"/> Streak</div>
          <div className="text-3xl font-bold text-yellow-400 stat-num">{user.streak || 0}</div>
          <div className="text-sm text-gray-500 mt-1">days in a row</div>
        </div>
      </div>

      {/* ROW 3: 3-Column Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Col 1: Calorie Ring */}
        <div className="dash-card bg-[#111118] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
          <h3 className="w-full text-lg font-bold mb-4 text-left">Calories Today</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/5 blur-2xl" />
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" strokeLinecap="round" />
              {/* Progress Ring */}
              <circle ref={ringRef} cx="96" cy="96" r="70" fill="none" stroke="#7c3aed" strokeWidth="16" strokeLinecap="round" strokeDasharray="440" strokeDashoffset="440" />
            </svg>
            <div className="relative z-10 text-center">
              <div className="text-4xl font-bold text-white stat-num">{consumed}</div>
              <div className="text-sm text-gray-400 mt-1">/ {calGoal} kcal</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-purple-400 font-bold">{calPct}%</span> <span className="text-gray-400">of daily goal</span>
          </div>
        </div>

        {/* Col 2: Macros */}
        <div className="dash-card bg-[#111118] p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-6">Macronutrients</h3>
          <div className="space-y-6">
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-blue-400">Protein</span>
                <span className="text-gray-400">{pCon}g / {pGoal}g</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden macro-bar">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${getPct(pCon, pGoal)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-yellow-400">Carbs</span>
                <span className="text-gray-400">{cCon}g / {cGoal}g</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden macro-bar">
                <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${getPct(cCon, cGoal)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-red-400">Fat</span>
                <span className="text-gray-400">{fCon}g / {fGoal}g</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden macro-bar">
                <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${getPct(fCon, fGoal)}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* Col 3: Hydration */}
        <div className="dash-card bg-[#111118] p-6 rounded-2xl border border-white/5 flex flex-col items-center">
          <h3 className="w-full text-lg font-bold mb-6 text-left flex justify-between">
            Hydration
            <span className="text-teal-400 text-sm font-medium">{water} / 8 glasses</span>
          </h3>
          <div className="grid grid-cols-4 gap-4 w-full flex-1 place-items-center mb-4">
            {[0,1,2,3,4,5,6,7].map((i) => (
              <button key={i} onClick={() => toggleWater(i)}
                className={`hydration-button w-12 h-16 rounded-3xl border-2 transition-all duration-300 flex items-center justify-center text-xl cursor-pointer hover:scale-110
                  ${i < water 
                    ? 'bg-teal-500/20 border-teal-500 text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]' 
                    : 'bg-white/5 border-white/10 text-white/20'}`}
              >
                💧
              </button>
            ))}
          </div>
          <div className="w-full text-center p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium">
            {water >= 8 ? "Goal Reached! Awesome hydration! 🌊" : "Keep drinking water to stay hydrated!"}
          </div>
        </div>

      </div>

      {/* ROW 4: Chart */}
      <div className="dash-card bg-[#111118] p-6 rounded-2xl border border-white/5 min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Weekly Calorie Trend</h3>
          <div className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400">Last 7 Days</div>
        </div>
        
        {chartData.length > 0 ? (
          <div className="w-full h-[240px]" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                {/* Proper YAxis orientation */}
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} domain={['dataMin - 200', 'dataMax + 200']} />
                <Tooltip 
                  contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="calories" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorCal)" activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-[240px] flex items-center justify-center bg-white/5 rounded-xl border border-white/5 text-gray-500">
            Log your meals to see your weekly trend!
          </div>
        )}
      </div>

      {/* ROW 5: Today's Diary */}
      <div className="dash-card bg-[#111118] p-8 rounded-3xl border border-white/5 shadow-2xl">
        <h2 className="font-bold text-2xl text-white mb-8 flex items-center gap-3">
          <span>📋</span> Today's Diary
        </h2>
        <div className="flex flex-col gap-6">
          {grouped.map(group => {
            const slotCal  = group.items.reduce((s,m) => s + m.totalCalories, 0);
            const slotProt = group.items.reduce((s,m) => s + m.totalProtein, 0);
            const meta = SLOT_META[group.slot];
            return (
              <div key={group.slot} className="rounded-2xl border border-white/5 overflow-hidden bg-white/[0.01]">
                {/* Slot header */}
                <div className="flex items-center justify-between px-6 py-4.5 bg-white/[0.03] border-b border-white/5">
                  <h3 className="font-bold text-lg md:text-xl flex items-center gap-3 text-white">
                    <span className="text-2xl">{meta.icon}</span> {meta.label}
                  </h3>
                  <div className="flex items-center gap-4 text-base font-bold">
                    <span className="text-[#06d6a0]">{Math.round(slotCal)} kcal</span>
                    <span className="text-white/20">·</span>
                    <span className="text-purple-400">{Math.round(slotProt)}g Protein</span>
                  </div>
                </div>
                {/* Items */}
                <div className="p-4 flex flex-col gap-3">
                  {group.items.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-4 italic">Nothing logged yet for {meta.label}</p>
                  ) : group.items.map(meal => (
                    <div key={meal._id}
                      className="flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all group/row">
                      <div className="min-w-0">
                        <div className="font-bold text-base text-white capitalize truncate">{meal.foods?.[0]?.name ?? 'Food'}</div>
                        <div className="text-sm text-white/40 mt-1">
                          {meal.foods?.[0]?.quantity ?? 1} × serving
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                        <div className="text-right">
                          <div className="font-black text-base text-white">{Math.round(meal.totalCalories)} kcal</div>
                          <div className="text-xs text-white/45 mt-1 font-semibold">
                            P {Math.round(meal.totalProtein)}g · C {Math.round(meal.totalCarbs)}g · F {Math.round(meal.totalFat)}g
                          </div>
                        </div>
                        <button onClick={() => handleDeleteMeal(meal._id)}
                          className="opacity-0 group-hover/row:opacity-100 p-2 text-white/35 hover:text-[#f72585] hover:bg-red-500/10 rounded-lg transition-all focus:outline-none cursor-pointer">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
