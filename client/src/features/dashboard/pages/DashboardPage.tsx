import { MetricCard } from "../components/MetricCard";
import { TaskQueue } from "../components/TaskQueue";
import { RecentAlertsWidget } from "../components/RecentAlertsWidget";
import { useDashboardData } from "../hooks/useDashboardData";
import { cn } from "@/lib/utils";
import { Role, type Role as RoleType } from "@/types";
import {
  ArrowReloadHorizontalIcon,
  ShoppingBasket01Icon,
  Activity01Icon,
  WarehouseIcon,
  TruckDeliveryIcon,
  MapsIcon,
  CallIcon,
} from "hugeicons-react";

export const DashboardPage = ({ role }: { role: RoleType }) => {
  const {
    loading,
    warehouses,
    alerts,
    orders,
    suppliers,
    managedWarehouses,
    refresh,
  } = useDashboardData();

  // ─── Derived Metrics ────────────────────────────────────────────────────────
  const hubPendingApprovals = orders.filter(o => o.status === 'PENDING_APPROVAL').length;
  const pendingDeliveries = orders.filter(o => o.status === 'APPROVED' || o.status === 'PARTIALLY_RECEIVED').length;

  // Single hub context for simple roles (Staff/Single-Manager)
  const primaryHub = managedWarehouses[0];
  const hubName = primaryHub?.name ?? 'Your Hub';
  const hubCapacityUsed = primaryHub
    ? Math.round((primaryHub.usedCapacity / primaryHub.capacity) * 100)
    : 0;

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading && orders.length === 0 && alerts.length === 0) {
    return (
      <div className="p-32 text-center flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loading Dashboard...</p>
      </div>
    );
  }

  const DashboardHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 mb-12">
      <div>
        <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">
          {role === Role.MANAGER
            ? `${managedWarehouses.length} Active Locations`
            : role === Role.STAFF && primaryHub
              ? `${primaryHub.name} · Staff Console`
              : 'System Overview'}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-left">
          {role === Role.ADMIN ? 'Admin Dashboard' :
            role === Role.MANAGER ? 'Manager Dashboard' :
              role === Role.OFFICER ? 'Purchasing Dashboard' : 'Operations Dashboard'}
        </h1>
        {/* Hub context badge for Staff or Manager with 1 Hub */}
        {(role === Role.STAFF || (role === Role.MANAGER && managedWarehouses.length === 1)) && primaryHub && (
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-xs font-black uppercase tracking-widest text-primary/70">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {hubName} · {hubCapacityUsed}% Capacity Used
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 p-2 bg-card/30 rounded-full border border-border shadow-2xl backdrop-blur-md">
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          <ArrowReloadHorizontalIcon className={cn("w-5 h-5", loading && "animate-spin")} />
          Sync Data
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === Role.ADMIN) {
    const activeAlerts = alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length;
    return (
      <div className="w-full space-y-10 pb-20">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Pending Approvals"
            value={orders.filter(o => o.status === 'PENDING_APPROVAL').length.toString()}
            hint="Orders Awaiting Review"
            icon={ShoppingBasket01Icon}
            color="primary"
            to="/admin/purchase-orders"
          />
          <MetricCard
            label="Security Alerts"
            value={activeAlerts.toString()}
            hint="Unresolved Critical Events"
            icon={Activity01Icon}
            color={activeAlerts > 0 ? "destructive" : "primary"}
            to="/admin/alerts"
          />
          <MetricCard
            label="Locations"
            value={warehouses.length.toString()}
            hint="Active Warehouses"
            icon={WarehouseIcon}
            color="primary"
            to="/admin/warehouses"
          />
          <MetricCard
            label="Orders in Transit"
            value={pendingDeliveries.toString()}
            hint="Approved Orders in Transit"
            icon={TruckDeliveryIcon}
            color="primary"
            to="/admin/purchase-orders"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-10">
            <TaskQueue orders={orders} userRole={role} />
          </div>
          <div className="lg:col-span-5 sticky top-12">
            <RecentAlertsWidget alerts={alerts} userRole={role} />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANAGER DASHBOARD — Single-hub focus
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === Role.MANAGER) {
    const primaryHub = managedWarehouses[0];
    const hubUtilization = primaryHub ? (primaryHub.usedCapacity / primaryHub.capacity) : 0;
    const activeAlerts = alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length;

    return (
      <div className="w-full space-y-10 pb-20">
        <DashboardHeader />

        {/* Operational Metrics for Manager - Action Oriented */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Approvals"
            value={hubPendingApprovals.toString()}
            hint="POs Awaiting Approval"
            icon={ShoppingBasket01Icon}
            color="primary"
            to="/manager/purchase-orders"
          />
          <MetricCard
            label="Incoming Shipments"
            value={pendingDeliveries.toString()}
            hint="Deliveries Due / Inbound"
            icon={TruckDeliveryIcon}
            color="primary"
            to="/manager/purchase-orders"
          />
          <MetricCard
            label="Storage Used"
            value={primaryHub ? `${Math.round(hubUtilization * 100)}%` : "0%"}
            hint={primaryHub ? primaryHub.name : "No Hub Assigned"}
            icon={WarehouseIcon}
            color={hubUtilization > 0.8 ? "destructive" : "primary"}
            to="/manager/warehouses"
          />
          <MetricCard
            label="System Alerts"
            value={activeAlerts.toString()}
            hint="Critical Alerts"
            icon={Activity01Icon}
            color={activeAlerts > 0 ? "destructive" : "primary"}
            to="/manager/alerts"
          />
        </div>

        {/* Detailed Hub Overview for Manager */}
        {primaryHub && (
          <div className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-[2rem] shadow-app-subtle overflow-hidden p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6 text-left">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <WarehouseIcon className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Current Location</p>
                  <h3 className="text-3xl font-black tracking-tight">{primaryHub.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-foreground/40 text-xs font-bold uppercase tracking-wider">
                      <MapsIcon className="w-3.5 h-3.5" />
                      {primaryHub.location}
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                    <div className="flex items-center gap-1.5 text-foreground/40 text-xs font-bold uppercase tracking-wider">
                      <CallIcon className="w-3.5 h-3.5" />
                      {primaryHub.phone || 'No phone'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 px-6 py-4 bg-background/40 rounded-3xl border border-border/20">
                <div className="text-right">
                  <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Used Volume</p>
                  <p className="text-xl font-black tabular-nums">{primaryHub.usedCapacity.toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-border/20" />
                <div className="text-right">
                  <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Capacity</p>
                  <p className="text-xl font-black tabular-nums text-foreground/40">{primaryHub.capacity.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <div className="flex-between text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="text-foreground/40">Usage</span>
                <span className={cn(
                  hubUtilization > 0.8 ? "text-status-error" : "text-primary"
                )}>{Math.round(hubUtilization * 100)}% OCCUPIED</span>
              </div>
              <div className="h-4 rounded-full bg-muted overflow-hidden border border-border/10 p-0.5">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    hubUtilization > 0.8 ? "bg-status-error shadow-[0_0_15px_rgba(var(--status-error),0.4)]" : "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                  )}
                  style={{ width: `${hubUtilization * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-10">
            <TaskQueue orders={orders} userRole={role} />
          </div>
          <div className="lg:col-span-5 sticky top-12">
            <RecentAlertsWidget alerts={alerts} userRole={role} />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFICER DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === Role.OFFICER) {
    const officerPending = orders.filter(o => o.status === 'PENDING_APPROVAL').length;
    return (
      <div className="w-full space-y-10 pb-20">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Purchasing"
            value={orders.filter(o => o.status !== 'CANCELLED').length.toString()}
            hint="Active Orders"
            icon={ShoppingBasket01Icon}
            color="primary"
            to="/purchase/orders"
          />
          <MetricCard
            label="Awaiting Approval"
            value={officerPending.toString()}
            hint="POs submitted for review"
            icon={Activity01Icon}
            color="primary"
            to="/purchase/orders"
          />
          <MetricCard
            label="Active Suppliers"
            value={suppliers.length.toString()}
            hint="Verified Suppliers"
            icon={ShoppingBasket01Icon}
            color="primary"
            to="/purchase/suppliers"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-10">
            <TaskQueue orders={orders} userRole={role} />
          </div>
          <div className="lg:col-span-5 sticky top-12">
            <RecentAlertsWidget alerts={alerts} userRole={role} />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-10 pb-20">
      <DashboardHeader />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Active Tasks"
          value={(pendingDeliveries + alerts.filter(a => !a.acknowledged).length).toString()}
          hint="Operational duties pending"
          icon={Activity01Icon}
          color="primary"
        />
        <MetricCard
          label="Deliveries Due"
          value={pendingDeliveries.toString()}
          hint="Incoming hub shipments"
          icon={TruckDeliveryIcon}
          color="primary"
          to="/warehouse/receive"
        />
        <MetricCard
          label="Storage Used"
          value={primaryHub ? `${hubCapacityUsed}%` : "0%"}
          hint={primaryHub
            ? `${primaryHub.name}: ${primaryHub.usedCapacity.toLocaleString()} / ${primaryHub.capacity.toLocaleString()} units`
            : "No hub linked to your profile"}
          icon={WarehouseIcon}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <TaskQueue orders={orders} userRole={role} />
        </div>
        <div className="lg:col-span-5 sticky top-12">
          <RecentAlertsWidget alerts={alerts} userRole={role} />
        </div>
      </div>
    </div>
  );
};
