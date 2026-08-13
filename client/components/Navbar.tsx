'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Zap, LogOut } from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard',           label: 'Dashboard' },
  { href: '/nutrition',           label: 'Nutrition' },
  { href: '/fitness',             label: 'Fitness' },
  { href: '/health/meal-planner', label: 'Health' },
  { href: '/ai',                  label: 'AI Assistant' },
  { href: '/profile',             label: 'Profile' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0d0f1a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Zap size={20} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
          <span className="font-['Outfit'] font-black text-xl text-white tracking-wide">
            NutriTrack
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-white bg-white/10 border border-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 tracking-wider uppercase">
                {user.name?.split(' ')[0] || 'zzz'}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer ml-1"
                title="Logout"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
