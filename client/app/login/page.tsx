'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.login-box',
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power4.out' }
    );
    gsap.fromTo('.bg-blob',
      { scale: 0.8, opacity: 0 },
      { scale: 1.2, opacity: 0.6, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' }
    );
  }, { scope: containerRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/initialize');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or login failed.');
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login('admin@nutritrack.app', 'Password123');
      router.push('/initialize');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Quick login failed.');
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center bg-[#080c18] overflow-hidden px-4">
      {/* Dynamic Background Gradients */}
      <div className="bg-blob absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px] pointer-events-none" />
      <div className="bg-blob absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="login-box z-10 w-full max-w-md bg-white/[0.02] border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3 inline-block text-yellow-400">⚡</div>
          <h1 className="font-['Outfit'] font-black text-3xl text-white tracking-wide">
            NutriTrack
          </h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to track your healthy journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nutritrack.app"
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/25 hover:opacity-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative z-10 px-3 bg-[#080c18] text-xs text-gray-500 font-bold uppercase tracking-widest">
            Demo Portal
          </span>
        </div>

        {/* Quick Demo Button */}
        <button
          onClick={handleQuickLogin}
          disabled={loading}
          className="w-full py-4.5 rounded-2xl bg-white/5 border border-white/10 text-yellow-400 font-bold text-xs tracking-wider uppercase hover:bg-white/[0.08] transition-all"
        >
          ⚡ Quick Log In (Admin User)
        </button>

        {/* Switch Link */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-bold ml-1 transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
