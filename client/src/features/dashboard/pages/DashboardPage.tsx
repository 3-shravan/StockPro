import { MetricCard } from "../components/MetricCard";
import { TaskQueue } from "../components/TaskQueue";
import { RecentAlertsWidget } from "../components/RecentAlertsWidget";
import { useDashboardData } from "../hooks/useDashboardData";
import { cn, formatCurrency } from "@/lib/utils";
import { Role, type Role as RoleType } from "@/types";
import {
  ArrowReloadHorizontalIcon,
  PackageIcon,
  ShoppingBasket01Icon,
  Money01Icon,
  Activity01Icon,
  WarehouseIcon,
  TruckDeliveryIcon,
} from "hugeicons-react";

export const DashboardPage = ({ role }: { role: RoleType }) => {
  const {
    loading,
    totalValue,
    products,
    warehouses,
    alerts,
    orders,
    suppliers,
    managedWarehouse,
    refresh,
  } = useDashboardData();

  // ─── Derived Metrics ────────────────────────────────────────────────────────
  // ADMIN: global low stock. MANAGER/OTHERS: already hub-scoped products from hook.
  const lowStockProducts = products.filter(p => p.currentQuantity <= p.reorderLevel);

  // For Manager: count POs pending approval in THEIR hub
  const hubPendingApprovals = orders.filter(o => o.status === 'PENDING_APPROVAL').length;

  // For Staff: count APPROVED POs (incoming deliveries they need to receive)
  const pendingDeliveries = orders.filter(o => o.status === 'APPROVED' || o.status === 'PARTIALLY_RECEIVED').length;

  // Hub name for Manager/Staff
  const hubName = managedWarehouse?.name ?? 'Your Hub';
  const hubCapacityUsed = managedWarehouse
    ? Math.round((managedWarehouse.usedCapacity / managedWarehouse.capacity) * 100)
    : 0;

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading && orders.length === 0 && alerts.length === 0) {
    return (
      <div className="p-32 text-center flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Decoding System Registry...</p>
      </div>
    );
  }

  const DashboardHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 mb-16">
      <div>
        <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">
          {role === Role.MANAGER && managedWarehouse
            ? `${managedWarehouse.name} · Operational Hub`
            : role === Role.STAFF && managedWarehouse
              ? `${managedWarehouse.name} · Staff Console`
              : 'Operational Command'}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
          {role === Role.ADMIN ? 'Administrator Console' :
            role === Role.MANAGER ? 'Management Hub' :
              role === Role.OFFICER ? 'Procurement Desk' : 'Operations Dashboard'}
        </h1>
        {/* Hub context badge for Manager/Staff */}
        {(role === Role.MANAGER || role === Role.STAFF) && managedWarehouse && (
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-xs font-black uppercase tracking-widest text-primary/70">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
          Sync Registry
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD — Full global view. No changes from original behavior.
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === Role.ADMIN) {
    const globalLowStock = lowStockProducts;
    return (
      <div className="w-full space-y-10 pb-20">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Global Valuation"
            value={formatCurrency(totalValue)}
            hint="Aggregate Market Value"
            icon={Money01Icon}
            to="/manager/reports"
          />
          <MetricCard
            label="Pending Protocols"
            value={orders.length.toString()}
            hint="Pending Order Cycles"
            icon={ShoppingBasket01Icon}
            color="warning"
            to="/admin/purchase-orders"
          />
          <MetricCard
            label="Density Critical"
            value={globalLowStock.length.toString()}
            hint="SKUs below Risk Threshold"
            icon={PackageIcon}
            color="destructive"
            to="/admin/products"
            state={{ filter: 'LOW_STOCK' }}
          />
          <MetricCard
            label="Managed Nodes"
            value={warehouses.length.toString()}
            hint="Active Distribution Centers"
            icon={Activity01Icon}
            to="/admin/warehouses"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-10">
            <TaskQueue orders={orders} alerts={alerts} userRole={role} />
          </div>
          <div className="lg:col-span-5 sticky top-12">
            <RecentAlertsWidget alerts={alerts} userRole={role} />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANAGER DASHBOARD — Hub-scoped: only their warehouse's data.
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === Role.MANAGER) {
    return (
      <div className="w-full space-y-10 pb-20">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hub-specific asset value from the reports API */}
          <MetricCard
            label="Hub Asset Value"
            value={formatCurrency(totalValue)}
            hint="Local Hub Equity"
            icon={Money01Icon}
            to="/manager/reports"
          />
          {/* Hub POs pending approval */}
          <MetricCard
            label="Hub Approvals"
            value={hubPendingApprovals.toString()}
            hint="POs awaiting authorization"
            icon={ShoppingBasket01Icon}
            color="warning"
            to="/manager/purchase-orders"
          />
          {/* Low stock products (globally tracked, but manager sees all) */}
          <MetricCard
            label="Local Risk Assets"
            value={lowStockProducts.length.toString()}
            hint="Hub stock below threshold"
            icon={PackageIcon}
            color="destructive"
            to="/manager/products"
            state={{ filter: 'LOW_STOCK' }}
          />
          {/* Hub capacity utilization */}
          <MetricCard
            label="Hub Capacity"
            value={managedWarehouse ? `${hubCapacityUsed}%` : 'N/A'}
            hint={managedWarehouse
              ? `${managedWarehouse.usedCapacity.toLocaleString()} / ${managedWarehouse.capacity.toLocaleString()} units`
              : 'No hub assigned'}
            icon={WarehouseIcon}
            to={managedWarehouse ? `/manager/stock/${managedWarehouse.warehouseId}` : undefined}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Hub-scoped task queue + procurement pipeline */}
          <div className="lg:col-span-7 space-y-10">
            <TaskQueue orders={orders} alerts={alerts} userRole={role} />
          </div>
          {/* Personal + hub alerts only */}
          <div className="lg:col-span-5 sticky top-12">
            <RecentAlertsWidget alerts={alerts} userRole={role} />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFICER DASHBOARD — Global procurement view across all hubs.
  // ═══════════════════════════════════════════════════════════════════════════
  if (role === Role.OFFICER) {
    const officerPending = orders.filter(o => o.status === 'PENDING_APPROVAL').length;
    return (
      <div className="w-full space-y-10 pb-20">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Active Procurement"
            value={orders.length.toString()}
            hint="Total Live PO Streams"
            icon={ShoppingBasket01Icon}
            color="warning"
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
            hint="Verified Vendor Network"
            icon={ShoppingBasket01Icon}
            to="/purchase/suppliers"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-10">
            <TaskQueue orders={orders} alerts={alerts} userRole={role} />
          </div>
          <div className="lg:col-span-5 sticky top-12">
            <RecentAlertsWidget alerts={alerts} userRole={role} />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF DASHBOARD — Hub-scoped: incoming deliveries + personal alerts only.
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-10 pb-20">
      <DashboardHeader />
      {/* Staff sees 3 focused metrics: their task count, deliveries due, hub capacity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          color="warning"
          to="/warehouse/receive"
        />
        <MetricCard
          label="Hub Capacity"
          value={managedWarehouse ? `${hubCapacityUsed}%` : 'N/A'}
          hint={managedWarehouse
            ? `${managedWarehouse.usedCapacity.toLocaleString()} / ${managedWarehouse.capacity.toLocaleString()} units`
            : 'No hub assigned'}
          icon={WarehouseIcon}
        />
      </div>

      {/* Staff only needs task queue + their personal alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7">
          <TaskQueue orders={orders} alerts={alerts} userRole={role} />
        </div>
        <div className="lg:col-span-5 sticky top-12">
          <RecentAlertsWidget alerts={alerts} userRole={role} />
        </div>
      </div>
    </div>
  );
};
