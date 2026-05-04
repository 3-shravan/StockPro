/**
 * ─── Theme Store (Zustand) ──────────────────────────────────────────────────
 * Manages light/dark mode preference.
 * Persisted to localStorage so the user's choice survives page refreshes.
 * Syncs the `.dark` class on `<html>` for Tailwind's dark mode variant.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  /** Call once on app mount to sync DOM with stored preference */
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },

      initTheme: () => {
        const { theme } = get();
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
    }),
    { name: 'stockpro-theme' },
  ),
);
