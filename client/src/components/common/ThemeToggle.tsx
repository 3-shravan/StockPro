import { Moon02Icon, Sun02Icon } from 'hugeicons-react';
import { useThemeStore } from '@/stores/theme.store';

/**
 * ThemeToggle — A premium theme switcher component using Hugeicons.
 * Connects to the Zustand theme store to toggle between light and dark modes.
 */
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-2xl p-2 transition-colors hover:bg-accent focus:outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <Moon02Icon className="w-5 h-5 text-foreground transition-all animate-in fade-in zoom-in duration-300" />
      ) : (
        <Sun02Icon className="w-5 h-5 text-foreground transition-all animate-in fade-in zoom-in duration-300" />
      )}
    </button>
  );
};
