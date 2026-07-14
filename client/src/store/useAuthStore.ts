import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  level: number;
  coins: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const isClient = typeof window !== 'undefined';
  const initialToken = isClient ? localStorage.getItem('pv_token') : null;
  const initialUser = isClient ? localStorage.getItem('pv_user') : null;

  let parsedUser: User | null = null;
  if (initialUser) {
    try {
      parsedUser = JSON.parse(initialUser);
    } catch {
      parsedUser = null;
    }
  }

  return {
    user: parsedUser,
    token: initialToken,
    isAuthenticated: !!initialToken && !!parsedUser,
    login: (user, token) => {
      if (isClient) {
        localStorage.setItem('pv_token', token);
        localStorage.setItem('pv_user', JSON.stringify(user));
      }
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      if (isClient) {
        localStorage.removeItem('pv_token');
        localStorage.removeItem('pv_user');
      }
      set({ user: null, token: null, isAuthenticated: false });
    },
    updateUser: (updates) => {
      set((state) => {
        if (!state.user) return {};
        const updatedUser = { ...state.user, ...updates };
        if (isClient) {
          localStorage.setItem('pv_user', JSON.stringify(updatedUser));
        }
        return { user: updatedUser };
      });
    },
  };
});
