import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useAlertsStore } from '@/stores/alerts.store';
import { NotificationCenter } from '@/features/alerts/components/NotificationCenter';

export const DashboardLayout = () => {
  const { isPanelOpen, setIsPanelOpen } = useAlertsStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="min-h-screen transition-[padding] duration-300 ease-out lg:pl-[var(--stockpro-sidebar-offset,20.5rem)]">
        <Header />
        <main className="max-w-8xl mx-auto px-12 py-2">
          <Outlet />
        </main>
      </div>

      <NotificationCenter 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </div>
  );
};
