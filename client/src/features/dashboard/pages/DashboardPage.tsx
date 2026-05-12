import { MetricCard } from "../components/MetricCard";
import { TaskQueue } from "../components/TaskQueue";
import { ProcurementPipelineWidget } from "../components/ProcurementPipelineWidget";
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
} from "hugeicons-react";

export const DashboardPage = ({ role }: { role: RoleType }) => {
  const { loading, totalValue, products, warehouses, alerts, orders, refresh } = useDashboardData();

  const isManagerOrAdmin = role === Role.MANAGER || role === Role.ADMIN;
  const lowStockProducts = products.filter(p => p.currentQuantity <= p.reorderLevel);

  const DashboardHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 mb-16">
      <div>
        <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Operational Command</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
          {role === Role.ADMIN ? 'Administrator Console' :
            role === Role.MANAGER ? 'Management Hub' :
              role === Role.OFFICER ? 'Procurement Desk' : 'Operations Dashboard'}
        </h1>
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

  if (loading && products.length === 0) {
    return (
      <div className="p-32 text-center flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Decoding System Registry...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-20">
      <DashboardHeader />

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Registry Valuation"
          value={formatCurrency(totalValue)}
          hint="Aggregate Market Asset Value"
          icon={Money01Icon}
          to={isManagerOrAdmin ? "/manager/reports" : undefined}
        />
        <MetricCard
          label="Active Protocols"
          value={orders.length.toString()}
          hint="Live Procurement Streams"
          icon={ShoppingBasket01Icon}
          color="warning"
          to="/purchase/orders"
        />
        <MetricCard
          label="Density Critical"
          value={lowStockProducts.length.toString()}
          hint="Assets below Risk Threshold"
          icon={PackageIcon}
          color="destructive"
          to={isManagerOrAdmin ? "/manager/products" : "/warehouse/products"}
          state={{ filter: 'LOW_STOCK' }}
        />
        <MetricCard
          label="Managed Nodes"
          value={warehouses.length.toString()}
          hint="Active Distribution Centers"
          icon={Activity01Icon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Operations Core - Main Focus (Expanded) */}
        <div className="lg:col-span-7 space-y-10">
          <TaskQueue orders={orders} alerts={alerts} userRole={role} />
          <ProcurementPipelineWidget orders={orders} userRole={role} />
        </div>

        {/* Intelligence Stream - Actionable Sidebar (Wider) */}
        <div className="lg:col-span-5 sticky top-12">
          <RecentAlertsWidget alerts={alerts} userRole={role} />
        </div>
      </div>
    </div>
  );
};
