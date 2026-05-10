import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft01Icon,
  Building05Icon,
  PackageIcon,
  Alert01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Settings02Icon,
  ChartBarLineIcon,
  DatabaseIcon,
  RefreshIcon
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { warehousesApi } from "@/features/warehouses/api";
import type { WarehouseStats } from "@/features/warehouses/types";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import type { WarehouseRequest } from "@/features/warehouses/types";
import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types";

export const WarehouseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<WarehouseRequest>({
    name: "",
    location: "",
    address: "",
    managerId: 0,
    capacity: 0,
    phone: ""
  });

  const user = useAuthStore((s) => s.user);
  const role = user?.role || Role.STAFF;

  const getRolePath = (suffix: string) => {
    const base = role === Role.ADMIN ? '/admin' : 
                 role === Role.MANAGER ? '/manager' :
                 role === Role.OFFICER ? '/purchase' : '/warehouse';
    return `${base}${suffix}`;
  };

  const loadStats = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [data, fullDetails] = await Promise.all([
        warehousesApi.getStats(Number(id)),
        warehousesApi.getById(Number(id))
      ]);
      setStats(data);
      setEditForm({
        name: fullDetails.name,
        location: fullDetails.location,
        address: fullDetails.address,
        managerId: fullDetails.managerId,
        capacity: fullDetails.capacity,
        phone: fullDetails.phone ?? ""
      });
    } catch (error: any) {
      showToast.error("Failed to load warehouse statistics.");
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!id) return;
    try {
      setIsReconciling(true);
      await warehousesApi.reconcile(Number(id));
      showToast.success("Capacity reconciled successfully.");
      await loadStats();
    } catch (error: any) {
      showToast.error("Reconciliation failed.");
    } finally {
      setIsReconciling(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsUpdating(true);
      await warehousesApi.update(Number(id), editForm);
      showToast.success("Warehouse updated successfully.");
      setIsEditModalOpen(false);
      await loadStats();
    } catch (error: any) {
      showToast.error("Failed to update warehouse.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, [id]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Analyzing storage data...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between bg-card/40 p-6 rounded-3xl border border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-2xl hover:bg-background shadow-sm"
          >
            <ArrowLeft01Icon className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.25rem] bg-primary text-primary-foreground shadow-xl shadow-primary/20">
              <Building05Icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{stats.warehouseName}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational Dashboard • ID #{stats.warehouseId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-2xl gap-2 h-12 px-6 border-border/50 hover:bg-background transition-all"
            onClick={handleReconcile}
            disabled={isReconciling}
          >
            <RefreshIcon className={cn("w-5 h-5", isReconciling && "animate-spin")} />
            Reconcile Capacity
          </Button>
          <Button 
            className="rounded-2xl gap-2 h-12 px-6 shadow-lg shadow-primary/20"
            onClick={() => {
              // We need full details for the form, but stats only has some
              // For now, we'll populate what we have and let the user fill the rest
              // In a real app, we'd fetch the full warehouse object
              setIsEditModalOpen(true);
            }}
          >
            <Settings02Icon className="w-5 h-5" />
            Manage Settings
          </Button>
        </div>
      </div>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Warehouse Settings"
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold px-1">Warehouse Name</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">Location / City</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.location}
                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold px-1">Phone</label>
              <input 
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold px-1">Full Address</label>
              <textarea 
                className="min-h-24 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.address}
                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold px-1">Capacity (Units)</label>
              <input 
                type="number"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                value={editForm.capacity}
                onChange={e => setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground bg-muted/50 p-4 rounded-2xl leading-relaxed">
            ⚠️ Note: Modification of storage capacity will re-calculate all utilization metrics and may affect stock placement algorithms.
          </p>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-12 rounded-2xl" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="ghost" className="h-12 px-6 rounded-2xl" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Inventory" 
          value={stats.totalItems.toLocaleString()}
          unit="Units"
          icon={<PackageIcon className="w-6 h-6" />}
          description="Total physical stock across all categories"
        />
        <StatCard 
          title="Unique Products" 
          value={stats.uniqueProducts.toString()}
          unit="SKUs"
          icon={<DatabaseIcon className="w-6 h-6" />}
          description="Distinct product lines managed here"
        />
        <StatCard 
          title="Capacity Usage" 
          value={`${stats.utilizedPercentage}%`}
          unit="Utilized"
          icon={<ChartBarLineIcon className="w-6 h-6" />}
          description={`${stats.usedCapacity.toLocaleString()} / ${stats.capacity.toLocaleString()} units`}
          progress={stats.utilizedPercentage}
        />
        <StatCard 
          title="Active Alerts" 
          value={stats.lowStockItems.toString()}
          unit="Issues"
          icon={<Alert01Icon className="w-6 h-6" />}
          description="Items requiring immediate attention"
          variant={stats.lowStockItems > 0 ? "warning" : "success"}
        />
      </div>

      {/* Detail Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Products Table */}
        <Card className="lg:col-span-2 rounded-3xl border-transparent bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Top Inventory Holdings</CardTitle>
                <CardDescription>Products with the highest stock concentration in this facility.</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary hover:bg-primary/5 rounded-xl"
                onClick={() => navigate(getRolePath('/products'))}
              >
                View Full Inventory
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-y border-border/50">
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Details</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity</th>
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stats.topProducts.map((product) => (
                    <tr key={product.productId} className="group hover:bg-background/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            #{product.productId}
                          </div>
                          <span className="font-semibold text-foreground">{product.productName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-medium">{product.quantity.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                          Optimal
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Capacity Visualization */}
        <Card className="rounded-3xl border-transparent bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="p-8">
            <CardTitle className="text-xl">Capacity Analytics</CardTitle>
            <CardDescription>Storage utilization breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="relative flex items-center justify-center py-4">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="transparent"
                  className="text-muted/30"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={502.4}
                  strokeDashoffset={502.4 - (502.4 * stats.utilizedPercentage) / 100}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000 ease-in-out",
                    stats.utilizedPercentage > 90 ? "text-destructive" : stats.utilizedPercentage > 75 ? "text-amber-500" : "text-primary"
                  )}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold tracking-tight">{Math.round(stats.utilizedPercentage)}%</span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-2xl bg-muted/30 border border-border/50">
                <span className="text-sm font-medium text-muted-foreground">Used Space</span>
                <span className="font-bold">{stats.usedCapacity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-2xl bg-muted/30 border border-border/50">
                <span className="text-sm font-medium text-muted-foreground">Free Space</span>
                <span className="font-bold">{(stats.capacity - stats.usedCapacity).toLocaleString()}</span>
              </div>
            </div>
            
            <p className="text-[11px] text-center text-muted-foreground leading-relaxed px-4">
              Warehouse efficiency is currently rated as <span className="text-emerald-500 font-bold">Excellent</span> based on storage optimization patterns.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  description: string;
  trend?: string;
  trendType?: 'up' | 'down';
  progress?: number;
  variant?: 'default' | 'warning' | 'success';
}

const StatCard = ({ title, value, unit, icon, description, trend, trendType, progress, variant = 'default' }: StatCardProps) => (
  <Card className="rounded-3xl border-transparent bg-card/60 backdrop-blur-md shadow-sm border-none overflow-hidden group hover:bg-card transition-all">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className={cn(
          "p-3 rounded-2xl",
          variant === 'warning' ? "bg-amber-500/10 text-amber-500" : 
          variant === 'success' ? "bg-emerald-500/10 text-emerald-500" :
          "bg-primary/10 text-primary"
        )}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg",
            trendType === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
          )}>
            {trendType === 'up' ? <ArrowUp01Icon className="w-3 h-3" /> : <ArrowDown01Icon className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      
      <div className="mt-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight">{value}</span>
          <span className="text-sm font-semibold text-muted-foreground">{unit}</span>
        </div>
        <p className="text-sm font-medium text-foreground/70 mt-2">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{description}</p>
      </div>

      {progress !== undefined && (
        <div className="mt-6 space-y-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                progress > 90 ? "bg-destructive" : progress > 70 ? "bg-amber-500" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);
