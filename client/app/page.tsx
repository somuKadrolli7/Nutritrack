'use client';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion, useInView } from 'framer-motion';
import {
  Heart,
  Activity,
  Apple,
  Zap,
  TrendingUp,
  Shield,
  Brain,
  Droplets,
  Flame,
  ChevronRight,
  Star,
  ArrowRight,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

/* ───────── Animated Counter ───────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ───────── Health Tip Cards Data ───────── */
const HEALTH_TIPS = [
  {
    icon: <Droplets className="w-6 h-6" />,
    title: 'Stay Hydrated',
    desc: 'Drink at least 8 glasses of water daily. Proper hydration boosts metabolism, improves skin health, and enhances cognitive function.',
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: <Apple className="w-6 h-6" />,
    title: 'Balanced Nutrition',
    desc: 'Eat a rainbow of fruits and vegetables. Each color represents different phytonutrients essential for your body\'s optimal performance.',
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: <Flame className="w-6 h-6" />,
    title: 'Active Lifestyle',
    desc: 'Aim for 150+ minutes of moderate exercise weekly. Regular physical activity reduces chronic disease risk by up to 50%.',
    color: 'from-orange-500 to-red-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'Mental Wellness',
    desc: 'Practice mindfulness and ensure 7-9 hours of quality sleep. Mental health is the foundation of overall well-being.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
];

/* ───────── Features Data ───────── */
const FEATURES = [
  {
    icon: <Activity className="w-7 h-7" />,
    title: 'Smart Calorie Tracking',
    desc: 'AI-powered food recognition automatically tracks your calorie intake with 98% accuracy.',
    gradient: 'from-purple-600 to-indigo-600',
  },
  {
    icon: <Heart className="w-7 h-7" />,
    title: 'Heart Health Monitor',
    desc: 'Real-time heart rate analysis with personalized insights to keep your cardiovascular system in peak condition.',
    gradient: 'from-rose-600 to-pink-600',
  },
  {
    icon: <TrendingUp className="w-7 h-7" />,
    title: 'Progress Analytics',
    desc: 'Beautiful charts and detailed analytics to visualize your health journey over weeks, months, and years.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: 'Personalized Plans',
    desc: 'Custom diet and fitness plans powered by AI, tailored to your body type, goals, and lifestyle.',
    gradient: 'from-emerald-500 to-teal-600',
  },
];

/* ───────── Marquee Items ───────── */
const MARQUEE_ITEMS = [
  { icon: <Apple className="w-4 h-4" />, text: 'SMART NUTRITION' },
  { icon: <Activity className="w-4 h-4" />, text: 'CALORIE TRACKING' },
  { icon: <Heart className="w-4 h-4" />, text: 'HEART HEALTH' },
  { icon: <Flame className="w-4 h-4" />, text: 'FITNESS GOALS' },
  { icon: <Droplets className="w-4 h-4" />, text: 'HYDRATION MONITOR' },
  { icon: <Brain className="w-4 h-4" />, text: 'AI-POWERED INSIGHTS' },
  { icon: <TrendingUp className="w-4 h-4" />, text: 'PROGRESS ANALYTICS' },
  { icon: <Shield className="w-4 h-4" />, text: 'PERSONALIZED PLANS' },
  { icon: <Zap className="w-4 h-4" />, text: 'MEAL PLANNER' },
  { icon: <Star className="w-4 h-4" />, text: 'WELLNESS TRACKER' },
];

/* ───────── Fade-in Wrapper ───────── */
function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   WELCOME PAGE
   ═══════════════════════════════════════════════════════ */
export default function WelcomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.fromTo('.hero-badge', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 })
      .fromTo('.hero-title', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
      .fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
      .fromTo('.hero-cta', { opacity: 0, y: 20, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, '-=0.3')
      .fromTo('.hero-image-card', { opacity: 0, scale: 0.9, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.15 }, '-=0.4');

    // Floating blobs animation
    gsap.to('.blob-1', { y: -30, x: 20, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.blob-2', { y: 20, x: -30, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.blob-3', { y: -20, x: -15, duration: 3.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }, { scope: heroRef });

  return (
    <div className="min-h-screen bg-[#080c18] text-white overflow-hidden">

      {/* ─── Sticky Nav ─── */}
      <nav className="fixed top-0 z-50 w-full bg-[#080c18]/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Zap size={22} className="text-yellow-400" />
            <span className="font-['Outfit'] font-black text-xl tracking-wide">NutriTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors font-medium">Features</a>
            <a href="#health-tips" className="text-sm text-gray-400 hover:text-white transition-colors font-medium">Health Tips</a>
            <a href="#stats" className="text-sm text-gray-400 hover:text-white transition-colors font-medium">Statistics</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-sm font-bold shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 transition-all hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Animated Blobs */}
        <div className="blob-1 absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
        <div className="blob-2 absolute top-40 right-[5%] w-[450px] h-[450px] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none" />
        <div className="blob-3 absolute bottom-0 left-[40%] w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Text */}
            <div className="max-w-2xl">
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  #1 AI Health Platform
                </span>
              </div>

              <h1 className="hero-title font-['Outfit'] font-black text-5xl md:text-7xl leading-[1.08] tracking-tight mb-6">
                Your Health,{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>

              <p className="hero-subtitle text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-lg">
                Track nutrition, fitness, and wellness with AI-powered precision.
                Get personalized insights that transform your daily habits into lasting health.
              </p>

              <div className="hero-cta flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 transition-all hover:scale-[1.02]"
                >
                  Start Free Today
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                >
                  Sign In
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            {/* Right — Stacked Image Cards */}
            <div className="relative hidden lg:block min-h-[500px]">
              <div className="hero-image-card absolute top-0 right-0 w-[320px] h-[240px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 rotate-3 z-30">
                <Image
                  src="/images/healthy-meal.png"
                  alt="Healthy balanced meal bowl"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Nutrition</span>
                  <p className="text-white text-sm font-semibold mt-0.5">Balanced Meals</p>
                </div>
              </div>

              <div className="hero-image-card absolute top-28 right-48 w-[300px] h-[220px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 -rotate-2 z-20">
                <Image
                  src="/images/fitness-yoga.png"
                  alt="Yoga and fitness wellness"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Fitness</span>
                  <p className="text-white text-sm font-semibold mt-0.5">Mind & Body</p>
                </div>
              </div>

              <div className="hero-image-card absolute top-56 right-12 w-[280px] h-[200px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 rotate-1 z-10">
                <Image
                  src="/images/health-tracking.png"
                  alt="Health metrics tracking"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Tracking</span>
                  <p className="text-white text-sm font-semibold mt-0.5">Smart Metrics</p>
                </div>
              </div>

              {/* Decorative floating badges */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-4 top-16 z-40 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-rose-500 fill-rose-500" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Heart Rate</p>
                    <p className="text-white font-bold text-sm">72 BPM</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-4 top-[360px] z-40 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-orange-500" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Calories</p>
                    <p className="text-white font-bold text-sm">1,847 kcal</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INFINITE MARQUEE TICKER ─── */}
      <section className="relative py-6 border-y border-white/5 overflow-hidden">
        <div className="marquee-track flex w-max">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-8 py-2 shrink-0"
            >
              <span className="text-purple-400">{item.icon}</span>
              <span className="text-xs font-bold text-gray-400 tracking-[0.2em] whitespace-nowrap">
                {item.text}
              </span>
              <span className="text-white/10">✦</span>
            </div>
          ))}
        </div>
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#080c18] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#080c18] to-transparent z-10 pointer-events-none" />
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="relative py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <Activity size={14} className="text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Powerful Features</span>
            </span>
            <h2 className="font-['Outfit'] font-black text-4xl md:text-5xl tracking-tight mb-4">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Peak Health
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Advanced AI meets intuitive design to give you the most comprehensive health tracking experience.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-500 hover:bg-white/[0.04] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="font-['Outfit'] font-bold text-xl mb-3 text-white group-hover:text-white/95">
                    {f.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HEALTH TIPS / INFO SECTION ─── */}
      <section id="health-tips" className="relative py-24 md:py-32 px-6 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Heart size={14} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Health Insights</span>
            </span>
            <h2 className="font-['Outfit'] font-black text-4xl md:text-5xl tracking-tight mb-4">
              Daily{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Health Tips
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Science-backed health recommendations to help you build sustainable healthy habits.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HEALTH_TIPS.map((tip, i) => (
              <FadeInSection key={i} delay={i * 0.12}>
                <div className={`group relative p-6 rounded-3xl ${tip.bg} border ${tip.border} hover:scale-[1.03] transition-all duration-500`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tip.color} flex items-center justify-center mb-5 shadow-lg`}>
                    {tip.icon}
                  </div>
                  <h3 className="font-['Outfit'] font-bold text-lg mb-2 text-white">{tip.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{tip.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GALLERY / IMAGE SHOWCASE ─── */}
      <section className="relative py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <h2 className="font-['Outfit'] font-black text-4xl md:text-5xl tracking-tight mb-4">
              Your Journey to{' '}
              <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                Better Health
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From nutrition to fitness, NutriTrack covers every aspect of your wellness journey.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { src: '/images/healthy-meal.png', alt: 'Healthy balanced meal', label: 'Nutrition Tracking', tag: 'Eat Smart', tagColor: 'text-emerald-400', description: 'Log meals with AI-powered food recognition. Get instant nutritional breakdowns and personalized dietary suggestions.' },
              { src: '/images/fitness-yoga.png', alt: 'Fitness and yoga', label: 'Fitness Routines', tag: 'Stay Active', tagColor: 'text-purple-400', description: 'Access 500+ guided workouts from yoga to HIIT. Track reps, sets, and calories burned automatically.' },
              { src: '/images/health-tracking.png', alt: 'Health metrics', label: 'Smart Monitoring', tag: 'Track Progress', tagColor: 'text-cyan-400', description: 'Connect your wearables for real-time health data. Monitor heart rate, steps, sleep quality, and more.' },
            ].map((card, i) => (
              <FadeInSection key={i} delay={i * 0.15}>
                <div className="group rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.06] hover:border-white/15 transition-all duration-500">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={card.src}
                      alt={card.alt}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080c18] via-transparent to-transparent" />
                    <span className={`absolute top-4 left-4 text-xs font-bold ${card.tagColor} uppercase tracking-wider bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full`}>
                      {card.tag}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-['Outfit'] font-bold text-xl mb-2 text-white">{card.label}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{card.description}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HEALTH FACTS BANNER ─── */}
      <section className="relative py-20 px-6">
        <FadeInSection>
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-cyan-600/20 border border-white/10 p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-indigo-500/10 blur-[60px] pointer-events-none" />

            <div className="relative z-10 text-center">
              <h2 className="font-['Outfit'] font-black text-3xl md:text-4xl mb-4">
                Did You Know?
              </h2>
              <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-4">
                People who track their nutrition are{' '}
                <span className="text-yellow-400 font-bold">3x more likely</span>{' '}
                to achieve their health goals. Regular health monitoring can reduce the risk of chronic diseases by up to{' '}
                <span className="text-emerald-400 font-bold">40%</span>.
              </p>
              <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                NutriTrack combines the power of AI with evidence-based health science to give you
                the best possible health companion — right in your pocket.
              </p>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="relative py-24 md:py-32 px-6">
        <FadeInSection>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-8">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Start Today — It&apos;s Free</span>
            </div>
            <h2 className="font-['Outfit'] font-black text-4xl md:text-6xl tracking-tight mb-6">
              Ready to Transform{' '}
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                Your Health?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Join thousands of users who have already taken control of their health with NutriTrack.
              No credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold tracking-wide shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 transition-all hover:scale-[1.03]"
              >
                Create Free Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" />
            <span className="font-['Outfit'] font-bold text-lg">NutriTrack</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} NutriTrack. All rights reserved. Your health, our priority.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
