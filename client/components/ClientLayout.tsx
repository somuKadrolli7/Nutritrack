'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import { usePathname, useRouter } from 'next/navigation';

const playGlobalClickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    if (!(window as any).__globalClickAudioCtx) {
      (window as any).__globalClickAudioCtx = new AudioContext();
    }
    const ctx = (window as any).__globalClickAudioCtx;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // A very soft, subtle, high-pitched mechanical tick
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Ignore audio errors
  }
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, fetchMe } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const handleGlobalClick = () => {
      playGlobalClickSound();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';
  const isInitializePage = pathname === '/initialize';

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicPage) {
        router.push('/login');
      } else if (user && isPublicPage) {
        router.push('/initialize');
      }
    }
  }, [user, loading, pathname, router, isPublicPage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-[#080c18] text-white">
        <div className="text-5xl mb-4 animate-bounce inline-block text-yellow-400">⚡</div>
        <h2 className="text-xl font-bold font-['Outfit'] tracking-wider mb-2">NutriTrack</h2>
        <p className="text-gray-400 text-sm font-medium">Checking your health portal...</p>
      </div>
    );
  }

  return (
    <>
      {(!isPublicPage && !isInitializePage) && <Navbar />}
      <main className={(isPublicPage || isInitializePage) ? "min-h-screen" : "max-w-[1600px] mx-auto px-4 md:px-6 py-6"}>
        {children}
      </main>
    </>
  );
}
