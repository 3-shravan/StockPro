/**
 * ─── React Query Client ─────────────────────────────────────────────────────
 * Shared QueryClient instance used by the AppProviders.
 *
 * Configuration rationale:
 *  - `staleTime: 5 min`  → reduces redundant refetches for mostly-static data
 *  - `retry: 1`          → one automatic retry on failure (network blips)
 *  - `refetchOnWindowFocus: false` → prevents jarring refetches when tabbing back
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,                         // Don't auto-retry mutations
    },
  },
});
