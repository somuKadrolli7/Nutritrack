'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const GOALS = [
  { value: 'lose_weight', label: '🔥 Lose Weight', desc: 'Burn fat & slim down' },
  { value: 'gain_muscle', label: '💪 Gain Muscle', desc: 'Build strength & size' },
  { value: 'maintain', label: '⚖️ Maintain', desc: 'Stay at current weight' },
  { value: 'improve_health', label: '❤️ Improve Health', desc: 'Feel better overall' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
  { value: 'active', label: 'Active', desc: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Intense daily exercise' },
];

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const containerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    goal: 'lose_weight',
    activityLevel: 'moderate',
    dietPreference: 'any',
  });

  useGSAP(() => {
    gsap.fromTo(
      '.register-box',
      { opacity: 0, y: 50, scale: 0.93 },
      { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power4.out' }
    );
    gsap.fromTo(
      '.bg-blob',
      { scale: 0.8, opacity: 0 },
      { scale: 1.2, opacity: 0.55, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut' }
    );
  }, { scope: containerRef });

  const animateStep = () => {
    gsap.fromTo(
      '.step-content',
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }
    );
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const goNext = () => {
    if (step === 1) {
      if (!form.name.trim()) { setError('Please enter your name.'); return; }
      if (!form.email.trim()) { setError('Please enter your email.'); return; }
      if (!form.password || form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    }
    setError('');
    setStep((s) => s + 1);
    setTimeout(animateStep, 10);
  };

  const goBack = () => {
    setError('');
    setStep((s) => s - 1);
    setTimeout(animateStep, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        age: form.age ? Number(form.age) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        gender: form.gender,
        goal: form.goal,
        activityLevel: form.activityLevel,
        dietPreference: form.dietPreference,
      });
      router.push('/initialize');
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message === 'Network Error' || !err.response) {
        setError('The server is waking up (Render free tier spin-up). Please wait 10-15 seconds and click Create Account again!');
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500/60 focus:bg-white/[0.08] transition-all text-sm placeholder-gray-600';

  const labelClass = 'block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2';

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center bg-[#080c18] overflow-hidden px-4 py-12"
    >
      {/* Animated Background Blobs */}
      <div className="bg-blob absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none" />
      <div className="bg-blob absolute bottom-[10%] right-[5%] w-[450px] h-[450px] rounded-full bg-indigo-600/20 blur-[110px] pointer-events-none" />
      <div className="bg-blob absolute top-[60%] left-[50%] w-[350px] h-[350px] rounded-full bg-pink-600/10 blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <div className="register-box z-10 w-full max-w-lg bg-white/[0.025] border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-indigo-500/5 rounded-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3 inline-block">🌿</div>
          <h1 className="font-['Outfit'] font-black text-3xl text-white tracking-wide">
            Create Account
          </h1>
          <p className="text-gray-500 text-sm mt-1">Join NutriTrack and start your journey</p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  step >= s ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-white/10'
                }`}
              />
            </div>
          ))}
          <span className="text-xs text-gray-500 font-bold ml-1 whitespace-nowrap">{step} / 2</span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── STEP 1: Account Info ── */}
          {step === 1 && (
            <div className="step-content space-y-5">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  placeholder="Alex Johnson"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="button"
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/25 hover:opacity-90 transition-all mt-2"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2: Body & Goals ── */}
          {step === 2 && (
            <div className="step-content space-y-6">
              {/* Body stats */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    type="number"
                    placeholder="25"
                    min="10"
                    max="100"
                    value={form.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="70"
                    min="20"
                    max="300"
                    value={form.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Height (cm)</label>
                  <input
                    type="number"
                    placeholder="175"
                    min="100"
                    max="250"
                    value={form.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className={labelClass}>Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'male', label: '♂ Male' },
                    { value: 'female', label: '♀ Female' },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => handleChange('gender', g.value)}
                      className={`py-3 rounded-2xl border text-sm font-bold transition-all ${
                        form.gender === g.value
                          ? 'bg-purple-600/30 border-purple-500/60 text-purple-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diet Preference */}
              <div>
                <label className={labelClass}>Diet Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'any', label: '🍽️ Any' },
                    { value: 'vegetarian', label: '🥬 Vegetarian' },
                    { value: 'non-vegetarian', label: '🍗 Non-Veg' },
                  ].map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => handleChange('dietPreference', d.value)}
                      className={`py-3 rounded-2xl border text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                        form.dietPreference === d.value
                          ? 'bg-purple-600/30 border-purple-500/60 text-purple-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className={labelClass}>Your Goal</label>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => handleChange('goal', g.value)}
                      className={`py-3 px-4 rounded-2xl border text-left transition-all ${
                        form.goal === g.value
                          ? 'bg-purple-600/30 border-purple-500/60'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-sm font-bold text-white">{g.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className={labelClass}>Activity Level</label>
                <div className="flex flex-col gap-2">
                  {ACTIVITY_LEVELS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => handleChange('activityLevel', a.value)}
                      className={`flex items-center justify-between px-5 py-3 rounded-2xl border text-sm transition-all ${
                        form.activityLevel === a.value
                          ? 'bg-indigo-600/25 border-indigo-500/60'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className={`font-bold ${form.activityLevel === a.value ? 'text-indigo-300' : 'text-gray-300'}`}>
                        {a.label}
                      </span>
                      <span className="text-xs text-gray-500">{a.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold text-sm hover:bg-white/10 transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/25 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : '🚀 Create Account'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-7">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold ml-1 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
