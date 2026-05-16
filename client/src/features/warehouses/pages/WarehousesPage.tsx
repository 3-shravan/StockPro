import { useEffect, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftRightIcon,
  Building05Icon,
  Edit02Icon,
  Delete02Icon,
  PlusSignIcon,
  PackageIcon,
  Location01Icon,
  MapsIcon,
  Tick01Icon,
  ViewIcon,
  ViewOffIcon,
  LayoutGridIcon,
  TableIcon,
  ArrowRight01Icon,
  Search01Icon,
  Database01Icon,
} from "hugeicons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/features/auth/api/auth.api";
import { warehousesApi } from "@/features/warehouses/api";
import { reportsApi } from "@/features/reports/api/reports.api";
import type { Warehouse, WarehouseRequest } from "@/features/warehouses/types";
import { cn } from "@/lib/utils";
import { UserSelect } from "@/components/common/UserSelect";
import { WarehouseSelect } from "@/components/common/WarehouseSelect";
import { ProductSelect } from "@/components/common/ProductSelect";

const emptyWarehouse: WarehouseRequest = {
  name: "",
  location: "",
  address: "",
  managerId: 0,
  capacity: 0,
  phone: "",
};

type TabType = 'directory' | 'registration' | 'transfer';

export const WarehousesPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [users, setUsers] = useState<Record<number, string>>({});
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<WarehouseRequest>(emptyWarehouse);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [transfer, setTransfer] = useState({
    fromWarehouseId: 0,
    toWarehouseId: 0,
    productId: 0,
    quantity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const editWarehouseIdFromState = location?.state?.editWarehouseId;

  useEffect(() => {
    if (editWarehouseIdFromState && warehouses.length > 0) {
      const warehouseToEdit = warehouses.find(w => w.warehouseId === editWarehouseIdFromState);
      if (warehouseToEdit) {
        edit(warehouseToEdit);
        // Clear state to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    }
  }, [editWarehouseIdFromState, warehouses]);
  const [showInactive, setShowInactive] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  const load = async (includeInactive = showInactive) => {
    setLoading(true);
    try {
      const [wRes, uRes] = await Promise.all([
        warehousesApi.getAll(includeInactive),
        authApi.getAll()
      ]);
      setWarehouses(wRes);

      const userMap = uRes.reduce((acc, u) => {
        acc[u.userId] = u.fullName;
        return acc;
      }, {} as Record<number, string>);
      setUsers(userMap);
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to load data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleInactive = () => {
    const nextValue = !showInactive;
    setShowInactive(nextValue);
    void load(nextValue);
  };

  useEffect(() => {
    void load();
  }, []);

  const update = (field: keyof WarehouseRequest, value: string | boolean | number) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'capacity' ? Number(value) : value,
    }));
  };

  const edit = (warehouse: Warehouse) => {
    setEditingId(warehouse.warehouseId);
    setForm({
      name: warehouse.name,
      location: warehouse.location,
      address: warehouse.address,
      managerId: warehouse.managerId,
      capacity: warehouse.capacity,
      phone: warehouse.phone ?? "",
    });
    setActiveTab('registration');
  };

  const remove = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"?`)) return;
    try {
      await warehousesApi.deactivate(id);
      showToast.success("Location deactivated.");
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to deactivate.");
    }
  };

  const activate = async (id: number, name: string) => {
    try {
      await warehousesApi.activate(id);
      showToast.success(`"${name}" reactivated.`);
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to activate.");
    }
  };

  const handleReconcile = async () => {
    if (!window.confirm("Perform global inventory update? This will align all product totals with physical location counts.")) return;

    setIsReconciling(true);
    try {
      await reportsApi.sync();
      showToast.success("Global inventory successfully updated.");
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Reconciliation failed.");
    } finally {
      setIsReconciling(false);
    }
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptyWarehouse);
    if (activeTab === 'registration') setActiveTab('directory');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.location || !form.capacity) {
      showToast.error("Required fields missing.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await warehousesApi.update(editingId, form);
        showToast.success("Location updated.");
      } else {
        await warehousesApi.create(form);
        showToast.success("Location created.");
      }
      reset();
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Unable to save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transfer.fromWarehouseId || !transfer.toWarehouseId || !transfer.productId || transfer.quantity <= 0) {
      showToast.error("Invalid transfer details.");
      return;
    }

    setIsSubmitting(true);
    try {
      await warehousesApi.transferStock({
        ...transfer,
        managerId: user?.userId ?? 0,
      });
      showToast.success("Transfer completed.");
      setTransfer({
        fromWarehouseId: 0,
        toWarehouseId: 0,
        productId: 0,
        quantity: 0,
      });
      setActiveTab('directory');
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Transfer failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [warehouse.name, warehouse.location, warehouse.address]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Locations</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
            All Locations
          </h1>
        </div>

        <div className="flex p-2 bg-card rounded-full border border-border shadow-app-subtle">
          <button
            onClick={() => { setActiveTab('directory'); reset(); }}
            className={cn(
              "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'directory' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building05Icon className="w-5 h-5" />
            Directory
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('registration')}
              className={cn(
                "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                activeTab === 'registration' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusSignIcon className="w-5 h-5" />
              Add New
            </button>
          )}
          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab('transfer')}
              className={cn(
                "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                activeTab === 'transfer' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowLeftRightIcon className="w-5 h-5" />
              Transfer
            </button>
          )}
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-12 px-2">
          <div className="flex flex-col items-center justify-center gap-10 w-full py-4">
            <div className="flex items-center gap-4 w-full max-w-4xl">
              <div className="relative group flex-1">
                <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="Search locations..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button
                onClick={toggleInactive}
                className={cn(
                  "flex items-center gap-3 px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-app-subtle shrink-0",
                  showInactive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/5"
                )}
              >
                {showInactive ? <ViewIcon className="w-5 h-5" /> : <ViewOffIcon className="w-5 h-5" />}
                {showInactive ? "All Locations" : "Active Locations"}
              </button>

              {isAdmin && (
                <button
                  onClick={handleReconcile}
                  disabled={isReconciling}
                  className="flex items-center gap-3 px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border border-border bg-card text-primary hover:bg-primary/5 shadow-app-subtle shrink-0 disabled:opacity-50"
                >
                  {isReconciling ? (
                    <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Database01Icon className="w-5 h-5" />
                  )}
                  {isReconciling ? "UPDATING..." : "UPDATE INVENTORY"}
                </button>
              )}

              <div className="flex p-2 bg-card/50 rounded-2xl border border-border shadow-app-subtle shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGridIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    viewMode === 'list' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TableIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-24 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Loading locations...</p>
            </div>
          ) : filteredWarehouses.length === 0 ? (
            <EmptyState
              icon={Building05Icon}
              title="No Locations Found"
              description="No locations match your current search filters."
            />
          ) : viewMode === 'grid' ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredWarehouses.map((warehouse) => {
                const usedPercent = warehouse.capacity
                  ? Math.min(100, Math.round((warehouse.usedCapacity / warehouse.capacity) * 100))
                  : 0;

                return (
                  <div
                    key={warehouse.warehouseId}
                    className={cn(
                      "group flex flex-col p-8 bg-card border border-border hover:border-primary/40 rounded-3xl transition-all duration-300 cursor-pointer shadow-app-card relative overflow-hidden",
                      !warehouse.active && "opacity-60 grayscale"
                    )}
                    onClick={() => {
                      const basePath = isAdmin ? "/admin/warehouses" : user?.role === 'MANAGER' ? "/manager/stock" : "/warehouse/stock";
                      navigate(`${basePath}/${warehouse.warehouseId}`);
                    }}
                  >
                    {!warehouse.active && (
                      <div className="absolute top-0 right-0 px-4 py-2 bg-muted text-[10px] font-bold text-muted-foreground rounded-bl-3xl border-l border-b border-border/20 uppercase tracking-wider">
                        Inactive
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                        <Building05Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500">
                          <ArrowRight01Icon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-8 text-left">
                      <h3 className="font-bold text-2xl leading-tight tracking-tight">{warehouse.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Location01Icon className="w-4 h-4" />
                        {warehouse.location}
                      </p>
                    </div>

                    <div className="space-y-4 mt-auto">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1 text-left">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Capacity Utilization</p>
                          <p className="font-bold tabular-nums text-sm">{warehouse.usedCapacity.toLocaleString()} / {warehouse.capacity.toLocaleString()}</p>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border",
                          usedPercent > 90 ? "bg-status-error/10 text-status-error border-status-error/20" : "bg-primary/10 text-primary border-primary/20"
                        )}>{usedPercent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            usedPercent > 90 ? "bg-status-error shadow-[0_0_10px_rgba(var(--status-error),0.5)]" : usedPercent > 70 ? "bg-status-warning" : "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                          )}
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-6 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground border border-border">
                          {users[warehouse.managerId]?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Manager</p>
                          <p className="text-sm font-bold truncate tracking-tight">{users[warehouse.managerId] || `User #${warehouse.managerId}`}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl shadow-app-card overflow-x-auto no-scrollbar px-2 backdrop-blur-sm bg-opacity-50">
              <Table className="min-w-[1000px] w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/40 h-14">
                    <TableHead className="px-8 font-black text-[11px] text-foreground/70 uppercase tracking-widest">Location Detail</TableHead>
                    <TableHead className="px-6 font-black text-[11px] text-foreground/70 uppercase tracking-widest">Region</TableHead>
                    <TableHead className="px-6 font-black text-[11px] text-foreground/70 uppercase tracking-widest w-[200px]">Capacity Utilization</TableHead>
                    <TableHead className="px-6 font-black text-[11px] text-foreground/70 uppercase tracking-widest w-[200px]">Manager</TableHead>
                    <TableHead className="px-8 font-black text-[11px] text-foreground/70 uppercase tracking-widest text-right w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.map((warehouse) => {
                    const usedPercent = warehouse.capacity
                      ? Math.min(100, Math.round((warehouse.usedCapacity / warehouse.capacity) * 100))
                      : 0;

                    return (
                      <TableRow
                        key={warehouse.warehouseId}
                        className={cn(
                          "group hover:bg-muted/20 border-b border-border/40 transition-all cursor-pointer h-20",
                          !warehouse.active && "opacity-60 grayscale"
                        )}
                        onClick={() => {
                          const basePath = isAdmin ? "/admin/warehouses" : user?.role === 'MANAGER' ? "/manager/stock" : "/warehouse/stock";
                          navigate(`${basePath}/${warehouse.warehouseId}`);
                        }}
                      >
                        <TableCell className="px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-muted/50 text-primary flex items-center justify-center shrink-0 border border-border/40 group-hover:border-primary/20 transition-all shadow-app-subtle">
                              <Building05Icon className="w-5 h-5" />
                            </div>
                            <div className="text-left min-w-0">
                              <span className="font-bold text-sm block leading-tight tracking-tight group-hover:text-primary transition-colors truncate">{warehouse.name}</span>
                              <span className="text-[11px] font-bold text-foreground/50 mt-1 block uppercase tracking-wider truncate">{warehouse.active ? 'Active Location' : 'Inactive'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6">
                          <div className="flex items-center gap-3 text-[11px] font-bold text-foreground/50 uppercase tracking-wider whitespace-nowrap">
                            <Location01Icon className="w-4 h-4 text-primary/40" />
                            {warehouse.location}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 text-left">
                          <div className="flex flex-col gap-2 w-40">
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                              <span className="text-foreground/50 tabular-nums">{warehouse.usedCapacity.toLocaleString()} Units</span>
                              <span className={cn(
                                "px-3 py-1 rounded-full border shadow-app-subtle",
                                usedPercent > 90 ? "bg-status-error/10 text-status-error border-status-error/20" : "bg-primary/10 text-primary border-primary/20"
                              )}>{usedPercent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  usedPercent > 90 ? "bg-status-error" : usedPercent > 70 ? "bg-status-warning" : "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                                )}
                                style={{ width: `${usedPercent}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6">
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] text-foreground/40 border border-border/60 shadow-app-subtle">
                              {users[warehouse.managerId]?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider leading-none mb-1">Manager</p>
                              <p className="text-sm font-bold truncate tracking-tight text-foreground/80">{users[warehouse.managerId] || `User #${warehouse.managerId}`}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && (
                              <>
                                {warehouse.active && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); edit(warehouse); }}
                                    className="w-9 h-9 flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
                                    title="Edit Location"
                                  >
                                    <Edit02Icon className="w-4.5 h-4.5" />
                                  </button>
                                )}
                                {warehouse.active ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); remove(warehouse.warehouseId, warehouse.name); }}
                                    className="w-9 h-9 flex items-center justify-center text-status-error/60 hover:text-status-error hover:bg-status-error/10 rounded-xl transition-all duration-300"
                                    title="Deactivate"
                                  >
                                    <Delete02Icon className="w-4.5 h-4.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); activate(warehouse.warehouseId, warehouse.name); }}
                                    className="w-9 h-9 flex items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
                                    title="Reactivate"
                                  >
                                    <Tick01Icon className="w-4.5 h-4.5" />
                                  </button>
                                )}
                              </>
                            )}
                            <ArrowRight01Icon className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'registration' && (
        <div className="max-w-4xl space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              {editingId ? <Edit02Icon className="w-6 h-6" /> : <PlusSignIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{editingId ? 'Edit Location' : 'Add Location'}</h2>
              <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mt-1">
                {editingId ? `EDITING DETAILS FOR ${form.name}` : 'ADDING NEW LOCATION'}
              </p>
            </div>
          </div>

          <div className="px-2">
            <form onSubmit={save} className="space-y-10">
              <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Location Name <span className="text-status-error">*</span>
                    </label>
                    <div className="relative group">
                      <Building05Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className={cn(
                          "h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20",
                          !isAdmin && editingId && "opacity-50 cursor-not-allowed"
                        )}
                        placeholder="LOCATION NAME"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        disabled={!isAdmin && !!editingId}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Region <span className="text-status-error">*</span>
                    </label>
                    <div className="relative group">
                      <MapsIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className={cn(
                          "h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20",
                          !isAdmin && editingId && "opacity-50 cursor-not-allowed"
                        )}
                        placeholder="CITY / REGION"
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        disabled={!isAdmin && !!editingId}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Full Address
                    </label>
                    <div className="relative group">
                      <Location01Icon className="absolute left-6 top-6 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <textarea
                        className="min-h-[120px] w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none placeholder:text-muted-foreground/20"
                        placeholder="ENTER FULL PHYSICAL ADDRESS..."
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Assigned Manager <span className="text-status-error">*</span>
                    </label>
                    <UserSelect
                      value={form.managerId}
                      onChange={(id) => setForm(f => ({ ...f, managerId: id }))}
                      placeholder="SELECT MANAGER"
                      roleFilter="MANAGER"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Storage Capacity <span className="text-status-error">*</span>
                    </label>
                    <div className="relative group">
                      <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="MAX UNITS"
                        value={form.capacity || ''}
                        onChange={(e) => update("capacity", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-8">
                <button
                  type="button"
                  onClick={reset}
                  className="px-10 h-14 rounded-full border border-border bg-card hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-wider transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-app-subtle shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : editingId ? 'SAVE CHANGES' : 'ADD LOCATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="max-w-4xl space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-2xl bg-status-warning/10 text-status-warning flex items-center justify-center border border-status-warning/20">
              <ArrowLeftRightIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Internal Transfer</h2>
              <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mt-1">
                MOVE STOCK BETWEEN LOCATIONS
              </p>
            </div>
          </div>

          <div className="px-2">
            <form onSubmit={submitTransfer} className="space-y-10">
              <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                      From Location <span className="text-status-error">*</span>
                    </label>
                    <WarehouseSelect
                      value={transfer.fromWarehouseId}
                      onChange={(id) => setTransfer(v => ({ ...v, fromWarehouseId: id }))}
                      placeholder="ORIGIN LOCATION"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                      To Location <span className="text-status-error">*</span>
                    </label>
                    <WarehouseSelect
                      value={transfer.toWarehouseId}
                      onChange={(id) => setTransfer(v => ({ ...v, toWarehouseId: id }))}
                      placeholder="DESTINATION LOCATION"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                      Product <span className="text-status-error">*</span>
                    </label>
                    <ProductSelect
                      value={transfer.productId}
                      onChange={(id) => setTransfer(v => ({ ...v, productId: id }))}
                      placeholder="SELECT PRODUCT"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                      Quantity <span className="text-status-error">*</span>
                    </label>
                    <div className="relative group">
                      <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-status-warning transition-colors" />
                      <input
                        type="number"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-status-warning/10 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="0"
                        value={transfer.quantity || ''}
                        onChange={(e) => setTransfer(v => ({ ...v, quantity: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="px-10 h-14 rounded-full border border-border bg-card hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-wider transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 h-14 rounded-full bg-status-warning text-white font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-app-subtle shadow-status-warning/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'PROCESSING...' : 'TRANSFER STOCK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
