import { NavLink } from 'react-router-dom';
import {
  DashboardCircleIcon,
  PackageIcon,
  WarehouseIcon,
  ShoppingBasket01Icon,
  UserGroupIcon,
  ArrowLeftRightIcon,
  Notification01Icon,
  Chart01Icon
} from 'hugeicons-react';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardCircleIcon, roles: [Role.STAFF, Role.OFFICER, Role.MANAGER, Role.ADMIN] },
  { label: 'Products', path: '/products', icon: PackageIcon, roles: [Role.STAFF, Role.OFFICER, Role.MANAGER, Role.ADMIN] },
  { label: 'Warehouses', path: '/warehouses', icon: WarehouseIcon, roles: [Role.STAFF, Role.OFFICER, Role.MANAGER, Role.ADMIN] },
  { label: 'Purchases', path: '/purchase-orders', icon: ShoppingBasket01Icon, roles: [Role.OFFICER, Role.MANAGER, Role.ADMIN] },
  { label: 'Suppliers', path: '/suppliers', icon: UserGroupIcon, roles: [Role.OFFICER, Role.MANAGER, Role.ADMIN] },
  { label: 'Movements', path: '/movements', icon: ArrowLeftRightIcon, roles: [Role.MANAGER, Role.ADMIN] },
  { label: 'Alerts', path: '/alerts', icon: Notification01Icon, roles: [Role.STAFF, Role.OFFICER, Role.MANAGER, Role.ADMIN] },
  { label: 'Reports', path: '/reports', icon: Chart01Icon, roles: [Role.MANAGER, Role.ADMIN] },
];

export const Navigation = () => {
  const { user } = useAuthStore();

  const filteredNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <div className="bg-background/50 border-border py-3 px-6 sticky top-20 z-30 flex justify-center">
      <nav className="flex items-center gap-1 bg-muted/20 p-1.5 rounded-full border border-border/40 backdrop-blur-sm">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[11px] font-black uppercase tracking-widest',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30 backdrop-blur-md shadow-[0_8px_32px_0_rgba(var(--primary),0.1)]'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )
            }
          >
            <item.icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
