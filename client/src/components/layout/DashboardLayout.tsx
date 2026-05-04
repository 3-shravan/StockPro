import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

/**
 * DashboardLayout — Simplified layout with header and sub-navigation.
 */
export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <Header />
      
      {/* Sub-Header Navigation */}
      <Navigation />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
