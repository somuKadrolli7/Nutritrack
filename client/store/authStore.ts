import { create } from 'zustand';
import api from '@/lib/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  goal?: string;
  activityLevel?: string;
  dietPreference?: string;
  avatar?: string;
  bmi?: number;
  streak?: number;
  waterGoal?: number;
  calorieGoal?: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  fetchMe: () => Promise<void>;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, loading: false });
    } catch {
      // Try refreshing token if we have a refresh token
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (refreshToken) {
        try {
          const refreshRes = await api.post('/auth/refresh', { refreshToken });
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', refreshRes.data.accessToken);
            localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
          }
          const userRes = await api.get('/auth/me');
          set({ user: userRes.data.user, loading: false });
          return;
        } catch {
          // Refresh failed
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
    set({ user: res.data.user });
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
    set({ user: res.data.user });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({ user: null });
  },
}));
