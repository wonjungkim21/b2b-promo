import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'user' | 'admin' | null;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: Role;
  setAuth: (auth: { accessToken: string; refreshToken: string; role: Role }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      setAuth: ({ accessToken, refreshToken, role }) => set({ accessToken, refreshToken, role }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, role: null }),
    }),
    { name: 'auth-storage' },
  ),
);
