import { Logout04Icon, UserIcon, PackageIcon } from "hugeicons-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-2xl border-b border-border/5 transition-all duration-300">
      <div className="max-w-8xl mx-auto flex h-14 items-center justify-between px-10">
        <div className="flex items-center gap-5">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 sm:flex lg:hidden">
            <div className="w-10 h-10 bg-foreground text-background rounded-xl flex items-center justify-center shadow-lg shadow-foreground/5">
              <PackageIcon className="w-6 h-6" />
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-4">
          <Link to="/profile" className="flex items-center gap-4 group pl-4 pr-1.5 py-1.5 rounded-2xl bg-muted/5 hover:bg-muted/10 border border-border/5 transition-all">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-foreground/80 leading-none group-hover:text-foreground transition-colors uppercase tracking-[0.05em]">
                {user?.fullName || user?.email || "User Account"}
              </p>
              <div className="flex items-center justify-end gap-2 mt-1.5">
                 <p className="text-[8px] font-black uppercase text-foreground/30 tracking-widest border-r border-border/10 pr-2">
                   {user?.role}
                 </p>
                 <div className="flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-primary" />
                   <p className="text-[8px] font-black uppercase text-primary tracking-widest">
                     {user?.department || 'GLOBAL HUB'}
                   </p>
                 </div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center group-hover:scale-105 transition-all duration-500 shadow-sm border border-foreground/10">
              <UserIcon className="w-5 h-5" />
            </div>
          </Link>

          <button
            onClick={() => void logout()}
            className="flex items-center gap-2.5 px-4 h-10 rounded-xl bg-muted/5 text-foreground/40 hover:bg-rose-400/10 hover:text-rose-400 transition-all duration-500 group border border-border/5 shadow-sm active:scale-95"
          >
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Sign Out</span>
            <Logout04Icon className="w-4 h-4 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </header>
  );
};
