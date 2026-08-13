'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

gsap.registerPlugin(useGSAP);

export default function ProfilePage() {
  const { user, fetchMe, logout } = useAuthStore();
  const { addToast } = useUIStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const [form, setForm] = useState({
    name: '', age: '', weight: '', height: '',
    goal: '', activityLevel: '', waterGoal: ''
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        age: String(user.age || ''),
        weight: String(user.weight || ''),
        height: String(user.height || ''),
        goal: user.goal || 'maintain',
        activityLevel: user.activityLevel || 'sedentary',
        waterGoal: String(user.waterGoal || 8)
      });
    }
  }, [user]);

  useGSAP(() => {
    gsap.fromTo('.anim-element',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', {
        name: form.name,
        age: Number(form.age),
        weight: Number(form.weight),
        height: Number(form.height),
        goal: form.goal,
        activityLevel: form.activityLevel,
        waterGoal: Number(form.waterGoal)
      });
      addToast({ type: 'success', title: 'Profile Updated', message: 'Your settings have been saved.' });
      await fetchMe();
      setEditing(false);
    } catch {
      addToast({ type: 'error', title: 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const inputCls = "w-full px-5 py-4 rounded-2xl text-base bg-white/5 border border-white/10 text-white outline-none focus:border-primary/50 focus:bg-white/10 transition-all peer";
  const labelCls = "absolute left-5 top-4 text-white/40 text-base transition-all peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-[#080c18] peer-focus:px-2 peer-valid:-top-2.5 peer-valid:text-xs peer-valid:px-2 peer-valid:bg-[#080c18]";
  const cardCls = "glass p-8 rounded-[32px] border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.35)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(108,99,255,0.18)] overflow-hidden relative";
  const statCardCls = "rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-inner transition-all duration-500 hover:bg-white/10";

  return (
    <div ref={containerRef} className="space-y-8 pb-16 max-w-6xl mx-auto px-4">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className={`${cardCls} anim-element`}>          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(108,99,255,0.18),transparent_28%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="w-28 h-28 rounded-full flex items-center justify-center font-bold text-5xl text-white shadow-[0_18px_70px_rgba(108,99,255,0.25)]"
                   style={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)' }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-2">
                <h1 className="font-['Outfit'] font-black text-4xl text-white tracking-tight">
                  {user.name}
                </h1>
                <p className="text-sm text-white/60 uppercase tracking-[0.2em]">Profile overview</p>
                <p className="text-base text-white/80">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={statCardCls}>
                <p className="text-xs text-white/50 uppercase tracking-[0.2em] mb-3">Status</p>
                <p className="text-lg font-semibold text-white">Active user</p>
                <p className="mt-2 text-sm text-white/60">All personal settings are loaded and ready to edit.</p>
              </div>
              <div className={statCardCls}>
                <p className="text-xs text-white/50 uppercase tracking-[0.2em] mb-3">Last update</p>
                <p className="text-lg font-semibold text-white">Real-time sync</p>
                <p className="mt-2 text-sm text-white/60">Changes are saved instantly when you submit the form.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Current goal</p>
                <p className="text-xl font-bold text-white">{form.goal === 'lose' ? 'Lose Weight' : form.goal === 'gain' ? 'Gain Muscle' : 'Maintain Weight'}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(prev => !prev)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] text-white font-semibold shadow-[0_18px_60px_rgba(108,99,255,0.2)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_70px_rgba(108,99,255,0.25)]"
              >
                {editing ? 'Close Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className={`${cardCls} anim-element flex flex-col gap-6`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={statCardCls}>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">Age</p>
              <p className="text-3xl font-black text-white">{user.age || '—'}</p>
            </div>
            <div className={statCardCls}>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">Height</p>
              <p className="text-3xl font-black text-white">{user.height || '—'} cm</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={statCardCls}>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">Weight</p>
              <p className="text-3xl font-black text-white">{user.weight || '—'} kg</p>
            </div>
            <div className={statCardCls}>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">Water goal</p>
              <p className="text-3xl font-black text-white">{user.waterGoal || 8} glasses</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${cardCls} anim-element`}>        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,37,133,0.16),transparent_28%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h2 className="font-bold text-3xl text-white">{editing ? 'Edit Your Profile' : 'Profile Settings'}</h2>
              <p className="mt-2 text-sm text-white/60">Use the form below to keep your profile clean and up to date.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setEditing(prev => !prev)}
                className="px-5 py-3 rounded-full bg-white/10 border border-white/15 text-white font-semibold transition-all duration-300 hover:bg-white/15 hover:scale-[1.02]"
              >
                {editing ? 'Cancel' : 'Open Edit Form'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-3 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 font-semibold flex items-center gap-2 transition-all duration-300 hover:bg-red-500/25 hover:text-red-300 hover:scale-[1.02] cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative group">
                  <input required value={form.name} onChange={e => update('name', e.target.value)} className={inputCls} placeholder=" " />
                  <label className={labelCls}>Full Name</label>
                </div>
                <div className="relative group">
                  <input type="number" required value={form.age} onChange={e => update('age', e.target.value)} className={inputCls} placeholder=" " />
                  <label className={labelCls}>Age</label>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative group">
                  <input type="number" required value={form.weight} onChange={e => update('weight', e.target.value)} className={inputCls} placeholder=" " />
                  <label className={labelCls}>Weight (kg)</label>
                </div>
                <div className="relative group">
                  <input type="number" required value={form.height} onChange={e => update('height', e.target.value)} className={inputCls} placeholder=" " />
                  <label className={labelCls}>Height (cm)</label>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/60">Primary Goal</label>
                  <select value={form.goal} onChange={e => update('goal', e.target.value)} className={`${inputCls} appearance-none text-white`}>
                    <option value="lose" className="text-black">🔻 Lose Weight</option>
                    <option value="maintain" className="text-black">⚖️ Maintain Weight</option>
                    <option value="gain" className="text-black">📈 Gain Muscle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/60">Activity Level</label>
                  <select value={form.activityLevel} onChange={e => update('activityLevel', e.target.value)} className={`${inputCls} appearance-none text-white`}>
                    <option value="sedentary" className="text-black">🛋️ Sedentary (desk job)</option>
                    <option value="light" className="text-black">🚶 Light (1-3x/week)</option>
                    <option value="moderate" className="text-black">🏃 Moderate (3-5x/week)</option>
                    <option value="active" className="text-black">⚡ Active (6-7x/week)</option>
                    <option value="veryActive" className="text-black">🔥 Very Active (athlete)</option>
                  </select>
                </div>
              </div>

              <div className="relative group md:w-1/2">
                <input type="number" required value={form.waterGoal} onChange={e => update('waterGoal', e.target.value)} className={inputCls} placeholder=" " />
                <label className={labelCls}>Daily Water Goal (glasses)</label>
              </div>

              <div className="flex flex-wrap gap-4 justify-end pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-4 rounded-full bg-gradient-to-r from-[#6c63ff] to-[#a78bfa] text-white font-bold shadow-[0_18px_60px_rgba(108,99,255,0.2)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-70"
                >
                  {saving ? '⏳ Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                <p className="text-sm text-white/50 uppercase tracking-[0.2em] mb-3">Full Name</p>
                <p className="text-lg font-semibold text-white">{user.name}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                <p className="text-sm text-white/50 uppercase tracking-[0.2em] mb-3">Email</p>
                <p className="text-lg font-semibold text-white">{user.email}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                <p className="text-sm text-white/50 uppercase tracking-[0.2em] mb-3">Goal</p>
                <p className="text-lg font-semibold text-white">{form.goal === 'lose' ? 'Lose Weight' : form.goal === 'gain' ? 'Gain Muscle' : 'Maintain Weight'}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                <p className="text-sm text-white/50 uppercase tracking-[0.2em] mb-3">Activity</p>
                <p className="text-lg font-semibold text-white">{form.activityLevel}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
