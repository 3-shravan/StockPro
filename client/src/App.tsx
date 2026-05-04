/**
 * ─── App Root ───────────────────────────────────────────────────────────────
 * Renders the route tree. All providers are in main.tsx.
 */
import { AppRoutes } from '@/router';
import { useThemeStore } from '@/stores/theme.store';
import { useEffect } from 'react';

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);

  // Sync the dark class on <html> with the persisted theme on first render
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <AppRoutes />;
}
