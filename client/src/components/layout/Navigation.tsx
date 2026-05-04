import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  { label: 'Dashboard', path: '/admin', icon: DashboardCircleIcon, roles: [Role.ADMIN] },
  { label: 'Users', path: '/admin/users', icon: UserGroupIcon, roles: [Role.ADMIN] },
  { label: 'Warehouses', path: '/admin/warehouses', icon: WarehouseIcon, roles: [Role.ADMIN] },
  { label: 'Analytics', path: '/admin/analytics', icon: Chart01Icon, roles: [Role.ADMIN] },
  { label: 'Alerts', path: '/admin/alerts', icon: Notification01Icon, roles: [Role.ADMIN] },

  { label: 'Dashboard', path: '/manager', icon: DashboardCircleIcon, roles: [Role.MANAGER] },
  { label: 'Products', path: '/manager/products', icon: PackageIcon, roles: [Role.MANAGER] },
  { label: 'Reports', path: '/manager/reports', icon: Chart01Icon, roles: [Role.MANAGER] },
  { label: 'Stock Overview', path: '/manager/stock', icon: WarehouseIcon, roles: [Role.MANAGER] },
  { label: 'Movements', path: '/manager/movements', icon: ArrowLeftRightIcon, roles: [Role.MANAGER] },
  { label: 'Alerts', path: '/manager/alerts', icon: Notification01Icon, roles: [Role.MANAGER] },

  { label: 'Dashboard', path: '/warehouse', icon: DashboardCircleIcon, roles: [Role.STAFF] },
  { label: 'Products', path: '/warehouse/products', icon: PackageIcon, roles: [Role.STAFF] },
  { label: 'Receive Goods', path: '/warehouse/receive', icon: PackageReceiveIcon, roles: [Role.STAFF] },
  { label: 'Issue Stock', path: '/warehouse/issue', icon: PackageMovingIcon, roles: [Role.STAFF] },
  { label: 'Transfer Stock', path: '/warehouse/transfer', icon: ArrowLeftRightIcon, roles: [Role.STAFF] },
  { label: 'Movements', path: '/warehouse/movements', icon: ArrowLeftRightIcon, roles: [Role.STAFF] },
  { label: 'Alerts', path: '/warehouse/alerts', icon: Notification01Icon, roles: [Role.STAFF] },

  { label: 'Dashboard', path: '/purchase', icon: DashboardCircleIcon, roles: [Role.OFFICER] },
  { label: 'Purchase Orders', path: '/purchase/orders', icon: ShoppingBasket01Icon, roles: [Role.OFFICER] },
  { label: 'Suppliers', path: '/purchase/suppliers', icon: UserGroupIcon, roles: [Role.OFFICER] },
  { label: 'Alerts', path: '/purchase/alerts', icon: Notification01Icon, roles: [Role.OFFICER] },
];

export const Navigation = () => {
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('stockpro-sidebar-collapsed') === 'true';
  });

  const filteredNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

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
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <NavLink to="/profile" className="block" title="Profile Settings">
                {({ isActive }) => (
                  <SidebarMenuButton active={isActive} className={collapsed ? 'justify-center px-0' : ''}>
                    <UserIcon className="h-4 w-4" />
                    {!collapsed && <span>Profile Settings</span>}
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter>
          <div className="rounded-2xl bg-sidebar-accent px-3 py-2 text-xs text-muted-foreground">
            {user?.email}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};
