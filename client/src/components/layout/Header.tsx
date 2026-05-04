import {
  Logout04Icon,
  UserIcon,
  PackageIcon,
} from 'hugeicons-react';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-20 border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* LEFT: Brand & Theme Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <PackageIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-foreground">
            StockPro
          </span>
        </div>
        <div className="w-px h-6 bg-border mx-2" />
        <ThemeToggle />
      </div>

      {/* RIGHT: Profile & Actions */}
      <div className="flex items-center gap-4">
        {/* User Profile Info */}
        <div className="flex items-center gap-3 pr-8 border-r border-border">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-foreground leading-none">
              {user?.fullName || 'Guest User'}
            </p>
            <p className="text-[9px] text-primary uppercase tracking-tighter mt-1 font-black bg-primary/10 px-1.5 py-0.5 rounded-sm border border-primary/20 italic">
              {user?.role || 'Guest'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group">
            <UserIcon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group hover:-translate-x-1"
          title="Sign Out"
        >
          <Logout04Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </header>
  );
};
