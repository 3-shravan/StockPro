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
  
  { label: 'Intelligence', path: '/admin/analytics', icon: Chart01Icon, roles: [Role.ADMIN] },
  { label: 'Intelligence', path: '/manager/reports', icon: Chart01Icon, roles: [Role.MANAGER] },

  { label: 'Products', path: '/manager/products', icon: PackageIcon, roles: [Role.MANAGER, Role.ADMIN, Role.STAFF] },
  { label: 'Suppliers', path: '/purchase/suppliers', icon: UserGroupIcon, roles: [Role.OFFICER, Role.ADMIN] },

  { label: 'Purchase Orders', path: '/manager/purchase-orders', icon: ShoppingBasket01Icon, roles: [Role.MANAGER, Role.ADMIN] },
  { label: 'Purchase Orders', path: '/purchase/orders', icon: ShoppingBasket01Icon, roles: [Role.OFFICER] },
  { label: 'Receive Goods', path: '/warehouse/receive', icon: PackageReceiveIcon, roles: [Role.STAFF, Role.ADMIN] },

  { label: 'Warehouses', path: '/manager/stock', icon: WarehouseIcon, roles: [Role.MANAGER, Role.ADMIN] },
  { label: 'Movements', path: '/manager/movements', icon: ArrowLeftRightIcon, roles: [Role.MANAGER, Role.ADMIN, Role.STAFF] },
  { label: 'Issue Stock', path: '/warehouse/issue', icon: PackageMovingIcon, roles: [Role.STAFF] },
  
  { label: 'Operations Pulse', path: '/admin/alerts', icon: Notification01Icon, roles: [Role.ADMIN] },
  { label: 'Operations Pulse', path: '/manager/alerts', icon: Notification01Icon, roles: [Role.MANAGER] },
  { label: 'Operations Pulse', path: '/warehouse/alerts', icon: Notification01Icon, roles: [Role.STAFF] },
  { label: 'Operations Pulse', path: '/purchase/alerts', icon: Notification01Icon, roles: [Role.OFFICER] },

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
    const items = navItems.filter(item => item.roles.includes(user.role));
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.label)) return false;
      seen.add(item.label);
      return true;
    });
  }, [user]);

  useEffect(() => {
    if (user?.userId) {
      void fetchUnreadCount(user.userId);
      const interval = setInterval(() => {
        void fetchUnreadCount(user.userId);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.userId, fetchUnreadCount]);

  useEffect(() => {
    localStorage.setItem('stockpro-sidebar-collapsed', String(collapsed));
    // Offset = left-4 (1rem) + sidebar width + gap (1.5rem)
    document.documentElement.style.setProperty(
      '--stockpro-sidebar-offset',
      collapsed ? '8.5rem' : '20.5rem',
    );
  }, [collapsed]);

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
                      
                      {item.label === 'Operations Pulse' && unreadCount > 0 && (
                        <span className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded-full text-[9px] font-bold shadow-sm",
                          isActive 
                            ? "bg-background text-foreground" 
                            : "bg-primary text-primary-foreground",
                          collapsed ? "absolute -right-1 -top-1 border-2 border-background" : "ml-auto"
                        )}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5 border-t border-border/5">
        <NavLink 
          to="/profile" 
          className={cn(
            "flex items-center transition-all duration-500 group rounded-[1.5rem]",
            collapsed ? "justify-center p-2" : "gap-4 px-4 py-4 bg-foreground/[0.02] dark:bg-white/[0.02] hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] border border-border/10 shadow-sm"
          )}
        >
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500",
            "bg-foreground text-background group-hover:scale-110",
            collapsed && "mx-auto"
          )}>
            <UserIcon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-foreground/80 group-hover:text-foreground transition-colors leading-none">{user?.email || 'User Account'}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <p className="truncate text-[9px] font-black text-foreground/30 uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
          )}
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
};
