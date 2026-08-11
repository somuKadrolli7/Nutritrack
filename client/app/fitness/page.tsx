'use client';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Search, Heart, Flame, Clock, Trophy, ListChecks, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { todayStr } from '@/lib/utils';

gsap.registerPlugin(useGSAP);

const WORKOUT_TEMPLATES = [
  { name: 'Running',          category: 'Cardio',      emoji: '🏃', duration: 30, calories: 343, intensity: 'high' },
  { name: 'Cycling',          category: 'Cardio',      emoji: '🚴', duration: 30, calories: 263, intensity: 'moderate' },
  { name: 'Swimming',         category: 'Water',       emoji: '🏊', duration: 30, calories: 203, intensity: 'moderate' },
  { name: 'Yoga',             category: 'Flexibility', emoji: '🧘', duration: 15, calories: 44,  intensity: 'low' },
  { name: 'Weight Training',  category: 'Strength',    emoji: '🏋️', duration: 45, calories: 263, intensity: 'moderate' },
  { name: 'Boxing',           category: 'Sports',      emoji: '🥊', duration: 30, calories: 273, intensity: 'high' },
  { name: 'Jump Rope',        category: 'Cardio',      emoji: '🪢', duration: 15, calories: 180, intensity: 'high' },
  { name: 'Stretching',       category: 'Flexibility', emoji: '🤸', duration: 20, calories: 50,  intensity: 'low' },
  { name: 'HIIT',             category: 'Cardio',      emoji: '⚡', duration: 20, calories: 300, intensity: 'high' },
  { name: 'Pilates',          category: 'Flexibility', emoji: '💪', duration: 30, calories: 120, intensity: 'moderate' },
  { name: 'Basketball',       category: 'Sports',      emoji: '🏀', duration: 30, calories: 240, intensity: 'high' },
  { name: 'Walking',          category: 'Cardio',      emoji: '🚶', duration: 30, calories: 100, intensity: 'low' },
];

const FILTER_CATEGORIES = ['All', 'Cardio', 'Strength', 'Flexibility', 'Sports', 'Water'];
const INTENSITIES = ['All Intensities', 'Low', 'Moderate', 'High'];
const SORT_OPTIONS = ['Default', 'Calories (High)', 'Calories (Low)', 'Duration'];

export default function FitnessPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [intensityFilter, setIntensityFilter] = useState('All Intensities');
  const [sortBy, setSortBy] = useState('Default');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Stats
  const [stats, setStats] = useState({ totalCaloriesBurned: 0, totalMinutes: 0, totalWorkouts: 0 });
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  // Custom logger
  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState(30);
  const [customIntensity, setCustomIntensity] = useState('moderate');
  const [customNotes, setCustomNotes] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, workoutsRes] = await Promise.all([
          api.get('/workouts/stats'),
          api.get(`/workouts?date=${todayStr()}`),
        ]);
        setStats(statsRes.data);
        setTodayWorkouts(workoutsRes.data.workouts || []);
        setStreak(user?.streak || 0);
      } catch { }
    };
    loadData();
    // Load favorites from localStorage
    const storedFavs = localStorage.getItem('nt_workout_favs');
    if (storedFavs) setFavorites(JSON.parse(storedFavs));
  }, [user]);

  useGSAP(() => {
    gsap.fromTo('.fit-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  const toggleFav = (name: string) => {
    const next = favorites.includes(name) ? favorites.filter(f => f !== name) : [...favorites, name];
    setFavorites(next);
    localStorage.setItem('nt_workout_favs', JSON.stringify(next));
  };

  const addTemplateWorkout = async (template: typeof WORKOUT_TEMPLATES[0]) => {
    try {
      await api.post('/workouts', {
        date: todayStr(),
        name: template.name,
        exercises: [{
          name: template.name,
          category: template.category.toLowerCase(),
          duration: template.duration,
          caloriesBurned: template.calories,
        }],
        intensity: template.intensity,
      });
      // Refresh
      const [statsRes, workoutsRes] = await Promise.all([
        api.get('/workouts/stats'),
        api.get(`/workouts?date=${todayStr()}`),
      ]);
      setStats(statsRes.data);
      setTodayWorkouts(workoutsRes.data.workouts || []);
    } catch { }
  };

  const addCustomWorkout = async () => {
    if (!customName.trim()) return;
    const calMap: Record<string, number> = { low: 3, moderate: 5, high: 8 };
    const estimatedCal = customDuration * (calMap[customIntensity] || 5);
    try {
      await api.post('/workouts', {
        date: todayStr(),
        name: customName,
        exercises: [{
          name: customName,
          category: 'cardio',
          duration: customDuration,
          caloriesBurned: estimatedCal,
        }],
        intensity: customIntensity,
        notes: customNotes,
      });
      setCustomName('');
      setCustomDuration(30);
      setCustomNotes('');
      const [statsRes, workoutsRes] = await Promise.all([
        api.get('/workouts/stats'),
        api.get(`/workouts?date=${todayStr()}`),
      ]);
      setStats(statsRes.data);
      setTodayWorkouts(workoutsRes.data.workouts || []);
    } catch { }
  };

  // Filter & sort templates
  let filtered = WORKOUT_TEMPLATES.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (intensityFilter !== 'All Intensities' && t.intensity !== intensityFilter.toLowerCase()) return false;
    if (showFavorites && !favorites.includes(t.name)) return false;
    return true;
  });

  if (sortBy === 'Calories (High)') filtered.sort((a, b) => b.calories - a.calories);
  if (sortBy === 'Calories (Low)') filtered.sort((a, b) => a.calories - b.calories);
  if (sortBy === 'Duration') filtered.sort((a, b) => b.duration - a.duration);

  const todayBurned = todayWorkouts.reduce((s, w) => s + (w.totalCaloriesBurned || 0), 0);
  const todayMinutes = todayWorkouts.reduce((s, w) => s + (w.totalDuration || 0), 0);
  const burnGoal = 500;
  const burnPct = Math.min(100, Math.round((todayBurned / burnGoal) * 100));

  if (!user) return null;

  return (
    <div ref={containerRef} className="flex gap-6 pb-12 text-white min-h-screen">

      {/* LEFT: Workout Grid */}
      <div className="flex-1 flex flex-col gap-6">

        {/* Search + Favorites */}
        <div className="fit-card flex items-center gap-3 bg-[#111118] px-5 py-4 rounded-2xl border border-white/5">
          <Search size={18} className="text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workouts..."
            className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-sm"
          />
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              showFavorites ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Heart size={14} className={showFavorites ? 'fill-red-500' : ''} /> Favorites
          </button>
        </div>

        {/* Category Filters */}
        <div className="fit-card flex flex-wrap gap-2">
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#111118] text-gray-400 border border-white/5 hover:text-white'
              }`}
            >
              🔥 {cat}
            </button>
          ))}
        </div>

        {/* Intensity + Sort */}
        <div className="fit-card flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase">Intensity</span>
            <select
              value={intensityFilter}
              onChange={(e) => setIntensityFilter(e.target.value)}
              className="bg-[#111118] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              {INTENSITIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold uppercase">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#111118] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              {SORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Workout Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div key={t.name} className="fit-card relative bg-[#111118] rounded-2xl border border-white/5 overflow-hidden group hover:border-purple-500/30 transition-all">
              {/* Gradient bottom bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 opacity-60" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{t.emoji}</span>
                    <div>
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-xs text-gray-400 uppercase font-bold">{t.category}</div>
                    </div>
                  </div>
                  <button onClick={() => toggleFav(t.name)} className="p-1">
                    <Heart size={16} className={favorites.includes(t.name) ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
                  </button>
                </div>

                <div className="text-2xl font-black text-white mb-1">{t.calories} kcal</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">for {t.duration} min target</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    t.intensity === 'high' ? 'text-red-400' :
                    t.intensity === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {t.intensity.charAt(0).toUpperCase() + t.intensity.slice(1)}
                  </span>
                </div>

                <button
                  onClick={() => addTemplateWorkout(t)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-500/20 border border-purple-500/20 text-purple-400 font-bold text-xs hover:from-purple-600/30 hover:to-pink-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Add to Today
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="hidden lg:flex flex-col gap-6 w-[320px] flex-shrink-0">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="fit-card bg-[#111118] p-4 rounded-2xl border border-white/5 text-center">
            <Flame size={18} className="text-orange-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Burned</div>
            <div className="text-lg font-black">{todayBurned} kcal</div>
          </div>
          <div className="fit-card bg-[#111118] p-4 rounded-2xl border border-white/5 text-center">
            <Clock size={18} className="text-blue-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Duration</div>
            <div className="text-lg font-black">{todayMinutes} min</div>
          </div>
          <div className="fit-card bg-[#111118] p-4 rounded-2xl border border-white/5 text-center">
            <Trophy size={18} className="text-yellow-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Streak</div>
            <div className="text-lg font-black">{streak} Days</div>
          </div>
          <div className="fit-card bg-[#111118] p-4 rounded-2xl border border-white/5 text-center">
            <ListChecks size={18} className="text-green-400 mx-auto mb-1" />
            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Logged</div>
            <div className="text-lg font-black">{todayWorkouts.length} Items</div>
          </div>
        </div>

        {/* Daily Target Burn */}
        <div className="fit-card bg-[#111118] p-6 rounded-2xl border border-white/5">
          <h3 className="font-bold text-white mb-1">Daily Target Burn</h3>
          <p className="text-xs text-gray-500 mb-4">Watch your live calorie consumption percentage rise today.</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-black">{todayBurned}</span>
              <span className="text-gray-500 text-sm">kcal / {burnGoal} kcal</span>
            </div>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="201" strokeDashoffset={201 - (201 * burnPct) / 100}
                  style={{ transition: 'stroke-dashoffset 1s ease' }} />
              </svg>
              <div className="text-center z-10">
                <div className="text-sm font-black">{burnPct}%</div>
                <div className="text-[8px] text-gray-500 uppercase">Burned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Activity Logger */}
        <div className="fit-card bg-[#111118] p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            🔥 Custom Activity Logger
          </h3>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Exercise Name</label>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Burpees, Mountain Climbers..."
              className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm outline-none focus:border-purple-500/30 placeholder:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration (Min)</label>
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm outline-none focus:border-purple-500/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Intensity</label>
              <select
                value={customIntensity}
                onChange={(e) => setCustomIntensity(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm outline-none"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workout Notes (Optional)</label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Additional focus, notes on fatigue, or heart rates..."
              rows={3}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-sm outline-none focus:border-purple-500/30 placeholder:text-gray-600 resize-none"
            />
          </div>

          <button
            onClick={addCustomWorkout}
            disabled={!customName.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
          >
            + Log Custom Activity
          </button>
        </div>
      </div>
    </div>
  );
}
