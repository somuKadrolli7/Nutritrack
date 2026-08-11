'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Power } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const playPowerUpSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.5);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 2.0);
  } catch (e) {
    // Ignore audio errors
  }
};

const playBeep = (freq = 800) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio errors
  }
};

export default function InitializePage() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Initial reveal animation
    gsap.fromTo(
      '.init-content',
      { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out' }
    );
    
    // Continuous pulse on the button
    gsap.to('.power-btn', {
      boxShadow: '0 0 20px 2px rgba(255, 255, 255, 0.1)',
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, { scope: containerRef });

  const handleStart = () => {
    if (initializing) return;
    setInitializing(true);
    
    playPowerUpSound();

    const tl = gsap.timeline();
    
    // 1. Button click effect
    tl.to('.power-btn', {
      scale: 0.9,
      duration: 0.1,
    })
    .to('.power-btn', {
      scale: 1.1,
      boxShadow: '0 0 40px 10px rgba(124, 58, 237, 0.5)',
      borderColor: 'rgba(124, 58, 237, 0.8)',
      color: '#a78bfa',
      duration: 0.4,
      ease: 'power2.out'
    });

    // 2. Change text rapidly to simulate boot sequence
    const texts = [
      "ESTABLISHING CONNECTION...",
      "SYNCING BIOMETRICS...",
      "LOADING AI MODELS...",
      "CALIBRATING DASHBOARD...",
      "SYSTEM READY."
    ];
    
    let textTl = gsap.timeline();
    texts.forEach((text, i) => {
      textTl.to('.status-text', {
        opacity: 0,
        duration: 0.15,
        onComplete: () => {
          const el = document.querySelector('.status-text');
          if (el) el.textContent = text;
          playBeep(i === texts.length - 1 ? 1200 : 800);
        }
      })
      .to('.status-text', {
        opacity: 1,
        duration: i === texts.length - 1 ? 0.5 : 0.2
      });
    });

    tl.add(textTl, "-=0.3");

    // 3. Zoom into the button and fade out everything to transition
    tl.to('.init-content', {
      scale: 5,
      opacity: 0,
      filter: 'blur(20px)',
      duration: 0.8,
      ease: 'power4.in',
      delay: 0.2,
      onComplete: () => {
        router.push('/dashboard');
      }
    });
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black flex items-center justify-center z-[100] overflow-hidden">
      <div className="init-content flex flex-col items-center justify-center relative z-10">
        
        {/* Power Button */}
        <button 
          onClick={handleStart}
          disabled={initializing}
          className="power-btn w-24 h-24 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-colors cursor-pointer mb-8 focus:outline-none"
        >
          <Power size={36} strokeWidth={1.5} />
        </button>

        {/* Status Text */}
        <div className="text-center">
          <h2 className="status-text font-['Outfit'] font-bold text-white/80 tracking-[0.2em] text-sm md:text-base mb-2">
            INITIALIZE SYSTEM
          </h2>
          {!initializing && (
            <p className="text-white/30 text-xs tracking-widest uppercase animate-pulse">
              Click to start
            </p>
          )}
        </div>
        
      </div>
      
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none" />
    </div>
  );
}
