import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  SidebarGroupLabel,
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
  // 1. Overview & Insights
  { label: 'Dashboard', path: '/admin', icon: DashboardCircleIcon, roles: [Role.ADMIN] },
  { label: 'Dashboard', path: '/manager', icon: DashboardCircleIcon, roles: [Role.MANAGER] },
  { label: 'Dashboard', path: '/warehouse', icon: DashboardCircleIcon, roles: [Role.STAFF] },
  { label: 'Dashboard', path: '/purchase', icon: DashboardCircleIcon, roles: [Role.OFFICER] },
  
  { label: 'Intelligence', path: '/admin/analytics', icon: Chart01Icon, roles: [Role.ADMIN] },
  { label: 'Intelligence', path: '/manager/reports', icon: Chart01Icon, roles: [Role.MANAGER] },

  // 2. Core Catalogue
  { label: 'Products', path: '/manager/products', icon: PackageIcon, roles: [Role.MANAGER, Role.ADMIN, Role.STAFF] },
  { label: 'Suppliers', path: '/purchase/suppliers', icon: UserGroupIcon, roles: [Role.OFFICER, Role.ADMIN] },

  // 3. Procurement & Inbound
  { label: 'Purchase Orders', path: '/manager/purchase-orders', icon: ShoppingBasket01Icon, roles: [Role.MANAGER, Role.ADMIN] },
  { label: 'Purchase Orders', path: '/purchase/orders', icon: ShoppingBasket01Icon, roles: [Role.OFFICER] },
  { label: 'Receive Goods', path: '/warehouse/receive', icon: PackageReceiveIcon, roles: [Role.STAFF, Role.ADMIN] },

  // 4. Inventory & Movements
  { label: 'Warehouses', path: '/manager/stock', icon: WarehouseIcon, roles: [Role.MANAGER, Role.ADMIN] },
  { label: 'Movements', path: '/manager/movements', icon: ArrowLeftRightIcon, roles: [Role.MANAGER, Role.ADMIN, Role.STAFF] },
  { label: 'Issue Stock', path: '/warehouse/issue', icon: PackageMovingIcon, roles: [Role.STAFF] },
  
  // 5. System & Control
  { label: 'Alerts', path: '/admin/alerts', icon: Notification01Icon, roles: [Role.ADMIN] },
  { label: 'Alerts', path: '/manager/alerts', icon: Notification01Icon, roles: [Role.MANAGER] },
  { label: 'Alerts', path: '/warehouse/alerts', icon: Notification01Icon, roles: [Role.STAFF] },
  { label: 'Alerts', path: '/purchase/alerts', icon: Notification01Icon, roles: [Role.OFFICER] },

  { label: 'Users', path: '/admin/users', icon: UserGroupIcon, roles: [Role.ADMIN] },
];

export const Navigation = () => {
  const { user } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useAlertsStore();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('stockpro-sidebar-collapsed') === 'true';
  });

  const filteredNavItems = useMemo(() => {
    if (!user) return [];
    
    const items = navItems.filter(item => item.roles.includes(user.role));
    
    // Deduplicate by label to avoid showing "Dashboard" or "Purchase Orders" multiple times
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
      // Poll for new alerts every 60 seconds
      const interval = setInterval(() => {
        void fetchUnreadCount(user.userId);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.userId, fetchUnreadCount]);

  useEffect(() => {
    localStorage.setItem('stockpro-sidebar-collapsed', String(collapsed));
    document.documentElement.style.setProperty(
      '--stockpro-sidebar-offset',
      collapsed ? '6.5rem' : '19rem',
    );
  }, [collapsed]);

  return (
    <Sidebar className={collapsed ? 'w-18' : 'w-72'}>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary">
              <PackageIcon className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-heading text-xl font-bold">StockPro</p>
                <p className="text-xs uppercase text-muted-foreground">
                  {user?.role} workspace
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ArrowRight01Icon className="h-4 w-4" />
            ) : (
              <MenuCollapseIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Workspace</SidebarGroupLabel>}
          <SidebarMenu>
            {filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <NavLink to={item.path} end className="block" title={item.label}>
                  {({ isActive }) => (
                    <SidebarMenuButton
                      active={isActive}
                      className={collapsed ? 'justify-center px-0' : ''}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                      {item.label === 'Alerts' && unreadCount > 0 && (
                        <span className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground",
                          collapsed ? "absolute -right-1 -top-1 border-2 border-sidebar shadow-sm" : "ml-auto"
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

      {!collapsed && (
        <SidebarFooter>
          <NavLink 
            to="/profile" 
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-full px-4 py-2.5 transition-all hover:bg-muted/40 group mb-4 mx-3 border border-transparent",
              isActive && "bg-primary/5 text-primary border-primary/10 shadow-sm"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
              <UserIcon className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-foreground/80">{user?.role}</p>
                <p className="truncate text-[8px] uppercase text-muted-foreground font-bold tracking-tight opacity-60">Account Settings</p>
              </div>
            )}
          </NavLink>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};
