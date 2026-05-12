import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="min-h-screen transition-[padding] duration-300 ease-out lg:pl-[var(--stockpro-sidebar-offset,20.5rem)]">
        <Header />
        <main className="max-w-8xl mx-auto px-12 py-2">
          <div className="animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
