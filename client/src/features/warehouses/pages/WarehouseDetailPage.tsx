import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft01Icon,
  PackageIcon,
  Alert01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Settings02Icon,
  ChartBarLineIcon,
  DatabaseIcon,
  RefreshIcon,
  UserIcon
} from "hugeicons-react";
import { authApi } from "@/features/auth/api/auth.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { warehousesApi } from "@/features/warehouses/api";
import type { WarehouseStats } from "@/features/warehouses/types";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  const [editForm, setEditForm] = useState<WarehouseRequest & { active: boolean }>({
    name: "",
    location: "",
    address: "",
    managerId: 0,
    capacity: 0,
    phone: "",
    active: true
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
        phone: fullDetails.phone ?? "",
        active: fullDetails.active
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
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between pt-4">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-card/60 backdrop-blur-sm shadow-app-subtle w-12 h-12 border border-border/40 shrink-0"
          >
            <ArrowLeft01Icon className="w-5 h-5" />
          </Button>
          <div className="text-left">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Distribution Hub</p>
              <span className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                editForm.active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-400/10 text-rose-400 border-rose-400/20"
              )}>
                {editForm.active ? "Active" : "Deactivated"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {stats.warehouseName}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <div className={cn("w-2 h-2 rounded-full shadow-app-subtle", editForm.active ? "bg-emerald-500 animate-pulse" : "bg-rose-400")} />
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                Operational Node • ID #{stats.warehouseId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-2 bg-card/30 rounded-full border border-border shadow-app-card backdrop-blur-md">
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-card text-foreground rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-muted active:scale-95 border border-border shadow-app-subtle"
            onClick={handleReconcile}
            disabled={isReconciling}
          >
            <RefreshIcon className={cn("w-4 h-4", isReconciling && "animate-spin")} />
            Sync Capacity
          </button>
          <button 
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 shadow-app-subtle shadow-primary/20"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Settings02Icon className="w-4 h-4" />
            Node Settings
          </button>
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

            <div className="space-y-2 sm:col-span-2 p-4 rounded-2xl bg-muted/30 border border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Operational Status</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Activate or suspend hub activities</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, active: !editForm.active })}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    editForm.active ? "bg-emerald-500" : "bg-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                    editForm.active ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Top Products Table */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border border-border/40 bg-card shadow-app-card overflow-hidden">
          {/* ... existing card header and content ... */}
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Top Inventory Holdings</CardTitle>
                <CardDescription className="text-xs">Products with the highest stock concentration in this facility.</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/5 rounded-xl text-xs h-8"
                onClick={() => navigate(getRolePath('/products'))}
              >
                View Full Inventory
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto no-scrollbar">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40 h-16">
                    <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest">Asset Parameters</TableHead>
                    <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest">Inventory Load</TableHead>
                    <TableHead className="px-8 font-black text-xs text-muted-foreground/80 uppercase tracking-widest text-right">Integrity Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProducts.map((product) => (
                    <TableRow key={product.productId} className="group hover:bg-muted/10 border-b border-border/40 transition-colors last:border-0 h-24">
                      <TableCell className="px-8">
                        <div className="flex items-center gap-6 whitespace-nowrap">
                          <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center text-base font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            #{product.productId}
                          </div>
                          <span className="font-black text-xl text-foreground tracking-tighter">{product.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 font-black text-xl text-foreground whitespace-nowrap tracking-tighter">
                        {product.quantity.toLocaleString()} Units
                      </TableCell>
                      <TableCell className="px-8 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-5 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-black uppercase tracking-widest border border-emerald-500/10">
                          Optimal
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Personnel Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Assigned Personnel</h3>
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider mt-1">Operational Team Registry for {stats.warehouseName}</p>
            </div>
            {(role === Role.ADMIN || role === Role.MANAGER) && (
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full font-bold text-[10px] uppercase tracking-wider h-10 px-6 border-border/40 bg-card/50"
                 onClick={() => navigate('/admin/users')}
               >
                 Manage Team
               </Button>
            )}
          </div>

          <PersonnelList warehouseName={stats.warehouseName} />
        </div>
      </div>
    </div>
  );
};

const PersonnelList = ({ warehouseName }: { warehouseName: string }) => {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const allUsers = await authApi.getAll();
        const filtered = allUsers.filter(u => u.department === warehouseName);
        setPersonnel(filtered);
      } catch (error) {
        console.error("Failed to load personnel", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchPersonnel();
  }, [warehouseName]);

  if (loading) return (
    <div className="h-32 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (personnel.length === 0) return (
    <div className="bg-white/[0.03] rounded-[2rem] border border-dashed border-border/40 p-12 text-center">
      <p className="text-muted-foreground text-sm font-medium">No personnel currently assigned to this hub.</p>
    </div>
  );

  return (
    <div className="grid gap-4 grid-cols-1 px-2">
      {personnel.map(user => (
        <div key={user.userId} className="bg-white/[0.05] p-5 rounded-[2rem] border border-border/10 flex items-center gap-5 hover:bg-white/[0.08] transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
            <UserIcon className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-base text-foreground truncate">{user.fullName}</h4>
            <div className="flex items-center gap-2 mt-1.5">
               <span className={cn(
                 "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                 user.role === Role.ADMIN ? "bg-rose-400/10 text-rose-400 border-rose-400/20" : 
                 user.role === Role.MANAGER ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                 "bg-primary/10 text-primary border-primary/20"
               )}>
                 {user.role}
               </span>
               <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
      ))}
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
  <Card className="rounded-[2.5rem] border-none bg-white/[0.05] shadow-app-card backdrop-blur-xl overflow-hidden group hover:bg-white/[0.08] transition-all">
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
