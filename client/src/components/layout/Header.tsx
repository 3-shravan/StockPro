import { Logout04Icon, UserIcon, PackageIcon } from "hugeicons-react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const routeMeta: Record<string, { title: string; description: string }> = {
  "/admin": {
    title: "Admin Command Center",
    description:
      "Cross-service visibility for users, warehouses, inventory, and procurement.",
  },
  "/admin/users": {
    title: "User Administration",
    description: "Control access, role assignments, and user lifecycle.",
  },
  "/admin/warehouses": {
    title: "Warehouse Administration",
    description:
      "Manage warehouse setup, utilization, and transfer operations.",
  },
  "/admin/analytics": {
    title: "Analytics & Reports",
    description:
      "Inventory valuation, stock risk, and PO lifecycle performance.",
  },
  "/admin/alerts": {
    title: "Alert Center",
    description: "Track and resolve critical operational notifications.",
  },
};

export const Header = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const current = routeMeta[location.pathname] ?? {
    title: "StockPro Workspace",
    description: "Role-based operations and inventory workflows.",
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <PackageIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground">
              StockPro
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-4">
          <Link to="/profile" className="flex items-center gap-3 group">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-foreground leading-none group-hover:text-primary transition-colors">
                {user?.fullName || `User #${user?.userId ?? ""}`}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase text-primary">
                {user?.role}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
              <UserIcon className="w-6 h-6 text-primary group-hover:text-primary-foreground group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <button
            onClick={() => void logout()}
            className="flex items-center justify-center w-10 h-10 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-300 group"
            title="Sign Out"
          >
            <Logout04Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 sm:px-6 lg:px-8">
        <p className="text-base font-semibold tracking-tight">
          {current.title}
        </p>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {current.description}
        </p>
      </div>
    </header>
  );
};
