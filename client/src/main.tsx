/**
 * ─── Application Entry Point ────────────────────────────────────────────────
 * Mounts the React app with all required providers:
 *   1. QueryClientProvider → React Query for data fetching
 *   2. Toaster            → Sonner toast notifications
 *   3. App                → Router + theme initialization
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { useThemeStore } from '@/stores/theme.store';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        theme={useThemeStore.getState().theme}
        toastOptions={{ duration: 4000 }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
