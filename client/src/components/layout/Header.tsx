import { Logout04Icon, UserIcon, PackageIcon, Notification01Icon } from "hugeicons-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useAlertsStore } from "@/stores/alerts.store";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Role } from "@/types";
import { cn } from "@/lib/utils";

export const Header = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, setIsPanelOpen } = useAlertsStore();

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border/5 transition-all duration-300">
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
          <Link to="/profile" className="flex items-center gap-4 group pl-5 pr-2 py-2 rounded-2xl bg-muted/5 hover:bg-muted/10 border border-border/5 transition-all">
            <div className="text-right hidden md:flex flex-col justify-center">
              <p className="text-[12px] font-black text-foreground/80 leading-tight group-hover:text-foreground transition-colors tracking-normal">
                {user?.fullName || user?.email || "User Account"}
              </p>
              <p className="text-[9px] font-black uppercase text-foreground/30 tracking-widest mt-0.5">
                {user?.role}
              </p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-105 transition-all duration-500 shadow-sm border border-white/10",
              user?.role === Role.ADMIN ? "bg-[#963E3E] text-white" :
                user?.role === Role.MANAGER ? "bg-[#7C69E3] text-white" :
                  user?.role === Role.OFFICER ? "bg-[#C5CE75] text-black" : "bg-primary text-white"
            )}>
              <UserIcon className="w-5 h-5" />
            </div>
          </Link>

          {/* Notification Bell */}
          <button
            onClick={() => setIsPanelOpen(true)}
            className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-muted/5 hover:bg-muted/10 border border-border/5 transition-all active:scale-95"
          >
            <Notification01Icon className={cn(
              "w-5 h-5 transition-all duration-300",
              unreadCount > 0 ? "text-[#7E69AB]" : "text-foreground/40 group-hover:text-foreground"
            )} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7E69AB] text-[9px] font-black text-black px-1 shadow-lg shadow-[#7E69AB]/25 border-2 border-background animate-in zoom-in duration-300">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => void logout()}
            className="flex items-center gap-2.5 px-4 h-10 rounded-xl bg-muted/5 text-foreground/40 hover:bg-status-error/10 hover:text-status-error transition-all duration-500 group border border-border/5 shadow-sm active:scale-95"
          >
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Sign Out</span>
            <Logout04Icon className="w-4 h-4 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </header>
  );
};
