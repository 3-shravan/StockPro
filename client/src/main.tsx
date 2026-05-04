/**
 * ─── Application Entry Point ────────────────────────────────────────────────
 * Mounts the React app with all required providers:
 *   1. QueryClientProvider → React Query for data fetching
 *   2. Toaster            → Sonner toast notifications
 *   3. App                → Router + theme initialization
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@/app/provider';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
