import * as React from 'react';
import { cn } from '@/lib/utils';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <aside
    ref={ref}
    data-slot="sidebar"
    className={cn(
      'fixed inset-y-4 left-4 z-40 hidden rounded-2xl bg-sidebar/95 text-sidebar-foreground shadow-xl shadow-foreground/5 ring-1 ring-sidebar-border/40 backdrop-blur-xl transition-[width] duration-300 ease-out lg:flex lg:flex-col',
      className,
    )}
    {...props}
  />
));
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-header"
    className={cn('p-3', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-content"
    className={cn('flex-1 overflow-y-auto px-3 py-2', className)}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-group"
    className={cn('space-y-1', className)}
    {...props}
  />
));
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-group-label"
    className={cn(
      'px-3 pb-2 pt-3 text-[11px] font-semibold uppercase text-muted-foreground',
      className,
    )}
    {...props}
  />
));
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    data-slot="sidebar-menu"
    className={cn('space-y-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-menu-item"
    className={cn('relative', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarMenuButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { active?: boolean }
>(({ active, className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-menu-button"
    data-active={active ? 'true' : 'false'}
    className={cn(
      'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-all duration-200',
      active
        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20'
        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      className,
    )}
    {...props}
  />
));
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="sidebar-footer"
    className={cn('p-3', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
};
