import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { useThemeStore } from '@/stores/theme.store';
import type { ReactNode } from 'react';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const theme = useThemeStore((s) => s.theme);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        theme={theme}
        toastOptions={{ duration: 4000 }}
      />
    </QueryClientProvider>
  );
};
