import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="min-h-screen transition-[padding] duration-300 ease-out lg:pl-[var(--stockpro-sidebar-offset,19rem)]">
        <Header />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
