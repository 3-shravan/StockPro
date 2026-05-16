import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft01Icon,
  PackageIcon,
  Alert01Icon,
  ChartBarLineIcon,
  DatabaseIcon,
  RefreshIcon,
  UserIcon,
  ArrowRight01Icon,
  UserEdit01Icon
} from "hugeicons-react";
import { authApi } from "@/features/auth/api/auth.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { warehousesApi } from "@/features/warehouses/api";
import type { WarehouseStats } from "@/features/warehouses/types";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";


import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types";

export const WarehouseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);

  const user = useAuthStore((s) => s.user);
  const role = user?.role || Role.STAFF;

  const getRolePath = (suffix: string) => {
    const base = role === Role.ADMIN ? '/admin' :
      role === Role.MANAGER ? '/manager' :
        role === Role.OFFICER ? '/purchase' : '/warehouse';
    return `${base}${suffix}`;
  };

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [statsData, detailsData] = await Promise.all([
        warehousesApi.getStats(Number(id)),
        warehousesApi.getById(Number(id))
      ]);
      setStats(statsData);
      setDetails(detailsData);
    } catch (error: any) {
      showToast.error("Failed to load location details.");
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!id) return;
    try {
      setIsReconciling(true);
      await warehousesApi.reconcile(Number(id));
      showToast.success("Capacity synced successfully.");
      await loadData();
    } catch (error: any) {
      showToast.error("Reconciliation failed.");
    } finally {
      setIsReconciling(false);
    }
  };



  useEffect(() => {
    void loadData();
  }, [id]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Loading location...</p>
      </div>
    );
  }

  if (!stats || !details) return null;

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
              <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Location</p>
              <span className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                details.active ? "bg-primary/10 text-primary border-primary/20" : "bg-status-error/10 text-status-error border-status-error/20"
              )}>
                {details.active ? "Active" : "Inactive"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {details.name}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <div className={cn("w-2 h-2 rounded-full shadow-app-subtle", details.active ? "bg-primary animate-pulse" : "bg-status-error")} />
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                Location • ID #{details.warehouseId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-6 py-3 bg-card text-foreground rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:bg-muted active:scale-95 border border-border shadow-app-subtle"
            onClick={handleReconcile}
            disabled={isReconciling}
          >
            <RefreshIcon className={cn("w-4 h-4", isReconciling && "animate-spin")} />
            Update Capacity
          </button>
          <button
            onClick={() => navigate(getRolePath('/warehouses'), { state: { editWarehouseId: Number(id) } })}
            className="w-12 h-12 rounded-full border border-border bg-primary text-primary-foreground flex-center hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            title="Edit Location"
          >
            <UserEdit01Icon className="icon-md" />
          </button>
        </div>
      </div>



      {/* Main Stats Grid */}
      {/* Performance Overview */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-1 shadow-app-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/20">
          
          {/* Inventory Levels */}
          <div className="p-10 space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <DatabaseIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Current Stock</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter text-foreground">
                  {stats.totalItems.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase">Units</span>
              </div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Total Inventory</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Across</span>
              <span className="text-sm font-black tracking-tight">{stats.uniqueProducts} Products</span>
            </div>
          </div>

          {/* Capacity Usage */}
          <div className="p-10 space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-status-info/10 text-status-info flex items-center justify-center">
                <ChartBarLineIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Capacity</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter text-status-info">
                  {stats.utilizedPercentage}%
                </span>
              </div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Capacity Used</p>
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>{stats.usedCapacity.toLocaleString()} / {stats.capacity.toLocaleString()}</span>
                <span className="text-foreground/40 text-[9px]">TOTAL CAPACITY</span>
              </div>
              <div className="w-full h-1.5 bg-muted/30 rounded-full mt-3 overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000 rounded-full",
                    stats.utilizedPercentage > 90 ? "bg-status-error" : stats.utilizedPercentage > 70 ? "bg-status-warning" : "bg-status-info"
                  )}
                  style={{ width: `${stats.utilizedPercentage}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Status Alerts */}
          <div className="p-10 space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                stats.lowStockItems > 0 ? "bg-status-warning/10 text-status-warning" : "bg-primary/10 text-primary"
              )}>
                <Alert01Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Alerts</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-4xl font-black tracking-tighter",
                  stats.lowStockItems > 0 ? "text-status-warning" : "text-foreground"
                )}>
                  {stats.lowStockItems}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase">Pending</span>
              </div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Pending Alerts</p>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium pt-2 italic">
              {stats.lowStockItems > 0 
                ? "Some items are low on stock and need attention." 
                : "All stock levels are normal."}
            </p>
          </div>

          {/* Performance Summary / Quick Action */}
          <div className="p-10 flex flex-col justify-center bg-muted/5">
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-card border border-border/40 shadow-app-subtle">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tighter text-foreground">Healthy</span>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              </div>
              <button 
                onClick={() => navigate('/warehouse/movements')}
                className="w-full group h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-between px-6 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                View Movements
                <ArrowRight01Icon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Detail Sections */}
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Facility Info & Redirect */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Location Information */}
          <Card className="rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-md shadow-app-card overflow-hidden text-left relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full -mr-16 -mt-16" />
            <CardHeader className="p-8 border-b border-border/10">
              <CardTitle className="text-xl font-bold tracking-tight">Location Details</CardTitle>
              <CardDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Details</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Address</p>
                  <p className="text-sm font-bold text-foreground/80 leading-relaxed">{details.address || 'No address'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Primary Contact</p>
                  <p className="text-sm font-bold text-foreground/80">{details.phone || 'No contact info'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Max Capacity</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black tabular-nums">{details.capacity.toLocaleString()}</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Units</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Current Status</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/20 border border-border/10">
                    <div className={cn("w-1.5 h-1.5 rounded-full", details.active ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-status-error")} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{details.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simple Inventory Redirect CTA */}
          <Card 
            className="rounded-[2.5rem] border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-app-card overflow-hidden group cursor-pointer"
            onClick={() => navigate(`${getRolePath('/products')}?hubId=${details.warehouseId}`)}
          >
            <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-card border border-border shadow-app-subtle flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <PackageIcon className="w-10 h-10 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black tracking-tighter text-foreground">View Inventory</h3>
                  <p className="text-sm text-muted-foreground font-medium">Manage all {stats.uniqueProducts} products stored here</p>
                </div>
              </div>
              <Button size="lg" className="rounded-2xl px-8 h-14 font-black text-[10px] uppercase tracking-widest shadow-lg group-hover:translate-x-2 transition-all">
                Explore Products
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Location Team</h3>
            <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider mt-1">Staff assigned to this location</p>
          </div>
          <PersonnelList warehouseName={stats.warehouseName} managerId={details.managerId} />
        </div>
      </div>
    </div>
  );
};

const PersonnelList = ({ warehouseName, managerId }: { warehouseName: string; managerId?: number }) => {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const allUsers = await authApi.getAll();
        const filtered = allUsers.filter(u =>
          u.department === warehouseName || (managerId !== undefined && u.userId === managerId)
        );
        setPersonnel(filtered);
      } catch (error) {
        console.error("Failed to load personnel", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchPersonnel();
  }, [warehouseName, managerId]);

  if (loading) return (
    <div className="h-32 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (personnel.length === 0) return (
    <div className="bg-white/[0.03] rounded-[2rem] border border-dashed border-border/40 p-12 text-center">
      <p className="text-muted-foreground text-sm font-medium">No staff currently assigned here.</p>
    </div>
  );

  return (
    <div className="space-y-3 px-2">
      {personnel.map(user => (
        <div 
          key={user.userId} 
          className="bg-card/40 p-4 rounded-2xl border border-border/40 flex items-center gap-4 hover:bg-muted/30 transition-all group relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <UserIcon className="w-5 h-5" />
          </div>
          
          <div className="min-w-0 flex-1 text-left">
            <h4 className="font-bold text-sm text-foreground truncate tracking-tight">{user.fullName}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                user.role === Role.ADMIN ? "bg-status-error/10 text-status-error border-status-error/20" :
                  user.role === Role.MANAGER ? "bg-status-warning/10 text-status-warning border-status-warning/20" :
                    "bg-primary/10 text-primary border-primary/20"
              )}>
                {user.role}
              </span>
              <div className="flex items-center gap-1 opacity-40">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>

          <button className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground/40 hover:text-primary transition-all opacity-0 group-hover:opacity-100">
            <RefreshIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};


