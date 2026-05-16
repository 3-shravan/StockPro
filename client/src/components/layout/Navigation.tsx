import { useEffect, useMemo, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRightIcon,
  Notification01Icon,
  ArrowRight01Icon,
  Chart01Icon,
  DashboardCircleIcon,
  MenuCollapseIcon,
  PackageIcon,
  PackageMovingIcon,
  PackageReceiveIcon,
  ShoppingBasket01Icon,
  UserGroupIcon,
  WarehouseIcon,
  UserIcon,
} from 'hugeicons-react';
import { useAuthStore } from '@/stores/auth.store';
import { useAlertsStore } from '@/stores/alerts.store';
import { showToast } from '@/lib/toast';
import { Role } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: DashboardCircleIcon, roles: [Role.ADMIN] },
  { label: 'Dashboard', path: '/manager', icon: DashboardCircleIcon, roles: [Role.MANAGER] },
  { label: 'Dashboard', path: '/warehouse', icon: DashboardCircleIcon, roles: [Role.STAFF] },
  { label: 'Dashboard', path: '/purchase', icon: DashboardCircleIcon, roles: [Role.OFFICER] },

  // Analytics / Reports — Admin & Manager only
  { label: 'Reports', path: '/admin/analytics', icon: Chart01Icon, roles: [Role.ADMIN] },
  { label: 'Reports', path: '/manager/reports', icon: Chart01Icon, roles: [Role.MANAGER] },

  // Inventory — hub-scoped for Manager/Staff; global catalogue for Admin; OFFICER has no inventory nav
  { label: 'Products', path: '/admin/products', icon: PackageIcon, roles: [Role.ADMIN] },
  { label: 'Inventory', path: '/manager/products', icon: PackageIcon, roles: [Role.MANAGER] },
  { label: 'Inventory', path: '/warehouse/products', icon: PackageIcon, roles: [Role.STAFF] },

  // Suppliers — Officer and Admin only
  { label: 'Suppliers', path: '/purchase/suppliers', icon: UserGroupIcon, roles: [Role.OFFICER, Role.ADMIN] },

  // Purchase Orders
  { label: 'Purchase Orders', path: '/manager/purchase-orders', icon: ShoppingBasket01Icon, roles: [Role.MANAGER] },
  { label: 'Purchase Orders', path: '/purchase/orders', icon: ShoppingBasket01Icon, roles: [Role.OFFICER] },
  { label: 'Purchase Orders', path: '/admin/purchase-orders', icon: ShoppingBasket01Icon, roles: [Role.ADMIN] },

  // Warehouse / Stock operations
  { label: 'Warehouses', path: '/admin/warehouses', icon: WarehouseIcon, roles: [Role.ADMIN] },
  { label: 'Receive Goods', path: '/warehouse/receive', icon: PackageReceiveIcon, roles: [Role.STAFF, Role.ADMIN] },
  { label: 'Issue Stock', path: '/warehouse/issue', icon: PackageMovingIcon, roles: [Role.STAFF] },

  // Movements (audit trail)
  { label: 'Movements', path: '/manager/movements', icon: ArrowLeftRightIcon, roles: [Role.MANAGER, Role.ADMIN] },
  { label: 'Movements', path: '/warehouse/movements', icon: ArrowLeftRightIcon, roles: [Role.STAFF] },

  // Alerts
  { label: 'System Alerts', path: '/admin/alerts', icon: Notification01Icon, roles: [Role.ADMIN] },
  { label: 'System Alerts', path: '/manager/alerts', icon: Notification01Icon, roles: [Role.MANAGER] },
  { label: 'System Alerts', path: '/warehouse/alerts', icon: Notification01Icon, roles: [Role.STAFF] },
  { label: 'System Alerts', path: '/purchase/alerts', icon: Notification01Icon, roles: [Role.OFFICER] },

  // Admin-only
  { label: 'Users', path: '/admin/users', icon: UserGroupIcon, roles: [Role.ADMIN] },
];

export const Navigation = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useAlertsStore();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('stockpro-sidebar-collapsed') === 'true';
  });

  const filteredNavItems = useMemo(() => {
    if (!user) return [];
    return navItems.filter(item => item.roles.includes(user.role));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('stockpro-sidebar-collapsed', String(collapsed));
    // Offset = left-4 (1rem) + sidebar width + gap (1.5rem)
    document.documentElement.style.setProperty(
      '--stockpro-sidebar-offset',
      collapsed ? '8.5rem' : '20.5rem',
    );
  }, [collapsed]);

  const [lastCount, setLastCount] = useState(unreadCount);

  useEffect(() => {
    if (user?.userId) {
      void fetchUnreadCount(user.userId, user.role, (user as any).warehouseId);
      const interval = setInterval(() => {
        void fetchUnreadCount(user.userId, user.role, (user as any).warehouseId);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (unreadCount > lastCount) {
      showToast.info("New system alert received");
    }
    setLastCount(unreadCount);
  }, [unreadCount]);

  return (
    <Sidebar className={cn("transition-all duration-500 border-r border-border/40 bg-sidebar/50 backdrop-blur-3xl", collapsed ? 'w-24' : 'w-72')}>
      <SidebarHeader className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard')}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-transform duration-500 group-hover:scale-110">
                <PackageIcon className="h-6 w-6" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="font-bold text-xl tracking-tight text-foreground leading-tight">StockPro</p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/10 text-muted-foreground transition-all hover:bg-foreground hover:text-background active:scale-95"
              >
                <MenuCollapseIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex h-11 w-11 mx-auto items-center justify-center rounded-xl bg-muted/10 text-muted-foreground transition-all hover:bg-foreground hover:text-background active:scale-95 border border-border/10 shadow-sm"
            >
              <ArrowRight01Icon className="h-5 w-5" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-5 py-3">
        <SidebarGroup>
          <SidebarMenu className="space-y-2">
            {filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <NavLink to={item.path} end title={item.label}>
                  {({ isActive }) => (
                    <SidebarMenuButton
                      active={isActive}
                      className={cn(
                        "h-14 rounded-2xl transition-all duration-500 flex items-center group/btn relative",
                        isActive
                          ? "bg-foreground text-background shadow-xl shadow-foreground/10"
                          : "text-muted-foreground/90 hover:text-foreground hover:bg-muted/5",
                        collapsed ? "w-14 mx-auto justify-center px-0" : "px-5 gap-4"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 transition-transform duration-500 group-hover/btn:scale-110", isActive && "text-background")} />
                      {!collapsed && <span className="font-bold text-[11px] uppercase tracking-[0.15em]">{item.label}</span>}
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5 border-border/5">
        <NavLink
          to="/profile"
          className={cn(
            "flex items-center transition-all duration-500 group rounded-full",
            collapsed ? "justify-center p-2" : "gap-4 pl-3 pr-6 py-2 bg-foreground/[0.02] dark:bg-white/[0.05] hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] border border-border/10 shadow-sm"
          )}
        >
          <div className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-500 shadow-sm border border-white/10",
            "group-hover:scale-110",
            user?.role === Role.ADMIN ? "bg-[#963E3E] text-white" :
              user?.role === Role.MANAGER ? "bg-[#7C69E3] text-white" :
                user?.role === Role.OFFICER ? "bg-[#C5CE75] text-black" : "bg-primary text-white",
            collapsed && "mx-auto"
          )}>
            <UserIcon className="h-3 w-3" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium tracking-[0.01em] text-foreground group-hover:text-foreground transition-colors leading-none">{user?.email || 'User Account'}</p>
            </div>
          )}
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
};
