import { create } from 'zustand';
import { adminApi } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  clientId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const result = await adminApi.login(email, password);
    localStorage.setItem('nestchat_admin_token', result.tokens.accessToken);
    set({ user: result.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('nestchat_admin_token');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('nestchat_admin_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const result = await adminApi.getMe();
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('nestchat_admin_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
