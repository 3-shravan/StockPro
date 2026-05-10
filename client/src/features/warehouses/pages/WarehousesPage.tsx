import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRightIcon,
  Building05Icon,
  Edit02Icon,
  Delete02Icon,
  PlusSignIcon,
  PackageIcon,
  UserIcon,
  Location01Icon,
  MapsIcon,
  CallIcon,
  InformationCircleIcon,
  Tick01Icon,
  WasteIcon,
  ViewIcon,
  ViewOffIcon
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";
import { warehousesApi } from "@/features/warehouses/api";
import type { Warehouse, WarehouseRequest } from "@/features/warehouses/types";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
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
  const [showInactive, setShowInactive] = useState(false);

  const load = async (includeInactive = showInactive) => {
    setLoading(true);
    try {
      setWarehouses(await warehousesApi.getAll(includeInactive));
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to load warehouses.",
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

  const update = (field: keyof WarehouseRequest, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: ["managerId", "capacity"].includes(field)
        ? Number(value)
        : value,
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
    if (!window.confirm(`Are you sure you want to deactivate "${name}"? It will no longer be visible in the active directory.`)) return;
    
    try {
      await warehousesApi.deactivate(id);
      showToast.success("Warehouse deactivated.");
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to deactivate warehouse.");
    }
  };

  const activate = async (id: number, name: string) => {
    try {
      await warehousesApi.activate(id);
      showToast.success(`"${name}" has been reactivated.`);
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to activate warehouse.");
    }
  };

  const hardDelete = async (id: number, name: string) => {
    if (!window.confirm(`⚠️ PERMANENT ACTION: Are you sure you want to PERMANENTLY DELETE "${name}" and all its historical stock data? This cannot be undone.`)) return;
    
    try {
      await warehousesApi.hardDelete(id);
      showToast.success("Warehouse permanently deleted.");
      await load();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to delete warehouse.");
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
      showToast.error("Please fill in all required fields (marked with *).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await warehousesApi.update(editingId, form);
        showToast.success("Warehouse updated.");
      } else {
        await warehousesApi.create(form);
        showToast.success("Warehouse created.");
      }
      reset();
      await load();
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to save warehouse.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transfer.fromWarehouseId || !transfer.toWarehouseId || !transfer.productId || transfer.quantity <= 0) {
      showToast.error("Please fill all fields and ensure quantity is greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await warehousesApi.transferStock({
        ...transfer,
        managerId: user?.userId ?? 0,
      });
      showToast.success("Stock transfer recorded.");
      setTransfer({
        fromWarehouseId: 0,
        toWarehouseId: 0,
        productId: 0,
        quantity: 0,
      });
      setActiveTab('directory');
      await load();
    } catch (error: any) {
      showToast.error(
        error.response?.data?.message || "Unable to transfer stock.",
      );
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
    <section className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Warehouses & Logistics</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage storage locations, capacities, and stock movements.
          </p>
        </div>

        <div className="flex p-1 bg-muted/50 rounded-2xl w-fit border border-border/50">
          <button
            onClick={() => { setActiveTab('directory'); reset(); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'directory' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building05Icon className="w-4 h-4" />
            Directory
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('registration')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === 'registration' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusSignIcon className="w-4 h-4" />
              New Warehouse
            </button>
          )}
          {isAdmin && editingId && activeTab === 'registration' && (
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-background text-foreground shadow-sm"
            >
              <Edit02Icon className="w-4 h-4" />
              Edit Warehouse
            </button>
          )}
          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab('transfer')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === 'transfer' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowLeftRightIcon className="w-4 h-4" />
              Stock Transfer
            </button>
          )}
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative group w-full max-w-md">
                  <InformationCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-12 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    placeholder="Search by name, city or address..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={toggleInactive}
                  variant={showInactive ? "secondary" : "ghost"}
                  className="rounded-2xl gap-2 h-12 px-6"
                >
                  {showInactive ? <ViewIcon className="w-5 h-5" /> : <ViewOffIcon className="w-5 h-5" />}
                  {showInactive ? "Showing All" : "Active Only"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="col-span-full py-20 text-center text-muted-foreground">Loading storage network...</p>
            ) : filteredWarehouses.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-muted/20 rounded-4xl border border-dashed border-border">
                <p className="text-muted-foreground">No warehouses found.</p>
              </div>
            ) : (
              filteredWarehouses.map((warehouse) => {
                const usedPercent = warehouse.capacity
                  ? Math.min(100, Math.round((warehouse.usedCapacity / warehouse.capacity) * 100))
                  : 0;
                
                return (
                  <Card 
                    key={warehouse.warehouseId} 
                    className={cn(
                      "rounded-3xl border-transparent bg-card/80 hover:bg-card shadow-sm transition-all group overflow-hidden cursor-pointer active:scale-[0.98]",
                      !warehouse.active && "opacity-60 grayscale-[0.5] border-dashed border-border"
                    )}
                    onClick={() => {
                      const basePath = isAdmin ? "/admin/warehouses" : user?.role === 'MANAGER' ? "/manager/stock" : "/warehouse/stock";
                      navigate(`${basePath}/${warehouse.warehouseId}`);
                    }}
                  >
                    <CardContent className="p-6">
                      {!warehouse.active && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground rounded-bl-xl border-l border-b">
                          Inactive
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                          <Building05Icon className="w-6 h-6" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {warehouse.active && isAdmin && (
                            <button 
                              onClick={() => edit(warehouse)}
                              className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                              title="Edit Details"
                            >
                              <Edit02Icon className="w-4 h-4" />
                            </button>
                          )}
                          
                          {isAdmin && (
                            <>
                              {warehouse.active ? (
                                <button 
                                  onClick={() => remove(warehouse.warehouseId, warehouse.name)}
                                  className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  title="Deactivate Warehouse"
                                >
                                  <Delete02Icon className="w-4 h-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => activate(warehouse.warehouseId, warehouse.name)}
                                  className="p-2 rounded-xl hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors"
                                  title="Activate Warehouse"
                                >
                                  <Tick01Icon className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button 
                                onClick={() => hardDelete(warehouse.warehouseId, warehouse.name)}
                                className="p-2 rounded-xl hover:bg-red-600/10 text-muted-foreground hover:text-red-600 transition-colors"
                                title="Permanently Delete"
                              >
                                <WasteIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          <button 
                            className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="View Statistics"
                          >
                            <ViewIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="font-bold text-lg">{warehouse.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Location01Icon className="w-3.5 h-3.5" />
                          {warehouse.location}
                        </p>
                      </div>

                      <div className="mt-6 space-y-3">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <span>Storage Capacity</span>
                          <span>{usedPercent}% Full</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              usedPercent > 90 ? "bg-destructive" : usedPercent > 70 ? "bg-amber-500" : "bg-primary"
                            )}
                            style={{ width: `${usedPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {warehouse.usedCapacity.toLocaleString()} / {warehouse.capacity.toLocaleString()} units utilized
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-medium">Mgr #{warehouse.managerId}</span>
                        </div>
                        {warehouse.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <CallIcon className="w-3 h-3" />
                            {warehouse.phone}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'registration' && (
        <Card className="max-w-3xl mx-auto rounded-4xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8 pt-8 px-10 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                {editingId ? <Edit02Icon className="w-6 h-6 text-primary" /> : <PlusSignIcon className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <CardTitle className="text-xl">{editingId ? 'Edit Warehouse details' : 'Register New Storage Location'}</CardTitle>
                <CardDescription>
                  {editingId ? `Update information for ${form.name}` : 'Setup a new warehouse in your logistics network.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={save} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Warehouse Name <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Unique identifier for this warehouse (e.g., North Hub A1)" />
                  </label>
                  <div className="relative group">
                    <Building05Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className={cn(
                        "h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none",
                        !isAdmin && editingId && "opacity-50 cursor-not-allowed bg-muted/20"
                      )}
                      placeholder="e.g. Central Distribution Center"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      disabled={!isAdmin && !!editingId}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    City / Region <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="The general geographical area where the warehouse is located." />
                  </label>
                  <div className="relative group">
                    <MapsIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className={cn(
                        "h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none",
                        !isAdmin && editingId && "opacity-50 cursor-not-allowed bg-muted/20"
                      )}
                      placeholder="e.g. New York, NY"
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                      disabled={!isAdmin && !!editingId}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Full Physical Address
                    <InfoTooltip content="Detailed address for shipping and navigation." />
                  </label>
                  <div className="relative group">
                    <Location01Icon className="absolute left-4 top-4 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="123 Industrial Way, Suite 500..."
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Warehouse Manager <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Select the authorized staff member responsible for this location." />
                  </label>
                  <UserSelect 
                    value={form.managerId} 
                    onChange={(id) => setForm({ ...form, managerId: id })} 
                    placeholder="Select Manager"
                    roleFilter="MANAGER"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Total Capacity <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Maximum number of units this warehouse can store." />
                  </label>
                  <div className="relative group">
                    <PackageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="number"
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. 5000"
                      value={form.capacity || ''}
                      onChange={(e) => update("capacity", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Contact Phone
                    <InfoTooltip content="Direct contact number for warehouse office." />
                  </label>
                  <div className="relative group">
                    <CallIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/20">
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Warehouse' : 'Initialize Warehouse'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={reset}
                  className="h-12 px-8 rounded-2xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'transfer' && (
        <Card className="max-w-2xl mx-auto rounded-4xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden">
          <CardHeader className="bg-primary/5 pb-8 pt-8 px-10 border-b border-primary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <ArrowLeftRightIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Internal Stock Transfer</CardTitle>
                <CardDescription>
                  Move products between warehouses safely and track movements.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={submitTransfer} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Source Warehouse <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="The location where stock is currently held." />
                  </label>
                  <WarehouseSelect 
                    value={transfer.fromWarehouseId} 
                    onChange={(id) => setTransfer(v => ({ ...v, fromWarehouseId: id }))} 
                    placeholder="Origin"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Destination Warehouse <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="The target location to receive the stock." />
                  </label>
                  <WarehouseSelect 
                    value={transfer.toWarehouseId} 
                    onChange={(id) => setTransfer(v => ({ ...v, toWarehouseId: id }))} 
                    placeholder="Destination"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Product <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="The item you wish to transfer between locations." />
                  </label>
                  <ProductSelect 
                    value={transfer.productId} 
                    onChange={(id) => setTransfer(v => ({ ...v, productId: id }))} 
                    placeholder="Select Item"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Transfer Quantity <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Number of units to move. Must be available in source." />
                  </label>
                  <div className="relative group">
                    <PackageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="number"
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. 50"
                      value={transfer.quantity || ''}
                      onChange={(e) => setTransfer(v => ({ ...v, quantity: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 gap-2">
                  <ArrowLeftRightIcon className="w-4 h-4" />
                  {isSubmitting ? 'Executing Transfer...' : 'Initiate Stock Transfer'}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  By clicking initiate, you confirm that stock levels will be adjusted across both locations.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </section>
  );
};
