/**
 * ─── App Root ───────────────────────────────────────────────────────────────
 * Renders the router. All providers are in main.tsx.
 */
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useThemeStore } from '@/stores/theme.store';
import { useEffect } from 'react';

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);

  // Sync the dark class on <html> with the persisted theme on first render
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <RouterProvider router={router} />;
}
