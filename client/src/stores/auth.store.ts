/**
 * ─── Auth Store (Zustand) ───────────────────────────────────────────────────
 * Central source of truth for authentication state.
 *
 * Features:
 *  - Persists user info and token to localStorage via Zustand `persist`.
 *  - `setAuth()` is called after login/register — stores user + token.
 *  - `logout()` clears everything and redirects to login.
 *  - `hasRole()` utility for checking RBAC in components.
 *
 * IMPORTANT: This store is also accessed from non-React code (api-client.ts)
 * via `useAuthStore.getState()` — that is the vanilla Zustand access pattern.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '@/types';

// ── State Shape ─────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ── Actions ─────────────────────────────────────────────────────────────────
interface AuthActions {
  /** Store user + token after successful login/register */
  setAuth: (user: User, token: string) => void;
  /** Update user object (e.g., after profile edit) without changing token */
  updateUser: (user: User) => void;
  /** Clear all auth state and redirect to login */
  logout: () => void;
  /** Check if the current user has a specific role */
  hasRole: (role: Role) => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // ── Initial State ─────────────────────────────────────────────────────
      user: null,
      token: null,
      isAuthenticated: false,

      // ── Actions ────────────────────────────────────────────────────────────
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      updateUser: (user) => {
        set({ user });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Hard redirect to login — ensures all in-memory state is cleared
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      },

      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },
    }),
    {
      name: 'stockpro-auth', // localStorage key
      // Only persist these fields (exclude functions)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
