import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PackageIcon,
  Search01Icon,
  FilterIcon,
  LayoutGridIcon,
  TableIcon,
  ArrowRight01Icon,
  Edit02Icon,
  PlusSignIcon,
  ShoppingBasket01Icon,
  Tag01Icon,
  BarCode01Icon,
  Grid02Icon,
  Money01Icon,
  ChartUpIcon,
  InformationCircleIcon,
  WarehouseIcon,
} from 'hugeicons-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useHubInventory } from '../hooks/useHubInventory';
import type { HubProduct } from '../hooks/useHubInventory';
import { productsApi } from '../api';
import { warehousesApi } from '@/features/warehouses/api';
import { showToast } from '@/lib/toast';
import type { ProductRequest } from '../types';

const emptyForm: ProductRequest = {
  sku: '',
  name: '',
  description: '',
  category: '',
  brand: '',
  unitOfMeasure: 'PCS',
  costPrice: 0,
  sellingPrice: 0,
  reorderLevel: 0,
  maxStockLevel: 0,
  leadTimeDays: 0,
  currentQuantity: 0,
  imageUrl: '',
  barcode: '',
  active: true,
};

type TabType = 'catalogue' | 'registration';

const ArrowDown01Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const HubInventoryPage = () => {
  const { user } = useAuthStore();
  const role = user?.role ?? Role.STAFF;
  const isManager = role === Role.MANAGER;
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, warehouse, warehouses, products, setSelectedWarehouse, refresh } = useHubInventory();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hubId = params.get('hubId');
    if (hubId && warehouses.length > 0) {
      const target = warehouses.find(w => w.warehouseId === Number(hubId));
      if (target && target.warehouseId !== warehouse?.warehouseId) {
        setSelectedWarehouse(target);
      }
    }
  }, [location.search, warehouses, setSelectedWarehouse, warehouse]);
  const [activeTab, setActiveTab] = useState<TabType>('catalogue');
  const [query, setQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductRequest>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false);

  const filtered = useMemo(() => {
    let r = products;
    if (lowStockOnly) r = r.filter(p => p.isLowStock);
    if (inStockOnly) r = r.filter(p => p.hubQty > 0);
    const q = query.trim().toLowerCase();
    if (!q) return r;
    return r.filter(p =>
      [p.name, p.sku, p.category, p.brand, p.barcode].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    );
  }, [products, query, lowStockOnly, inStockOnly]);

  const updateForm = (f: keyof ProductRequest, v: string | number) => {
    const nums = ['costPrice', 'sellingPrice', 'reorderLevel', 'maxStockLevel', 'leadTimeDays', 'currentQuantity'];
    setForm((c: ProductRequest) => ({ ...c, [f]: nums.includes(f) ? Number(v) : v }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setActiveTab('catalogue');
  };

  const openEdit = (p: HubProduct) => {
    setEditingId(p.productId);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description ?? '',
      category: p.category,
      brand: p.brand ?? '',
      unitOfMeasure: p.unitOfMeasure,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      reorderLevel: p.reorderLevel,
      maxStockLevel: p.maxStockLevel,
      leadTimeDays: p.leadTimeDays,
      active: p.active,
      imageUrl: p.imageUrl ?? '',
      barcode: p.barcode ?? '',
      currentQuantity: p.hubQty
    });
    setActiveTab('registration');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      showToast.error('Please fill in all required fields (*).');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        // If we have a selected location context (Location Inventory)
        if (warehouse) {
          const productInList = products.find(p => p.productId === editingId);
          const oldHubStock = productInList?.hubQty ?? 0;

          // 1. Sync Location Stock first to trigger alerts and movements
          if (form.currentQuantity !== oldHubStock) {
            await warehousesApi.updateStock({
              warehouseId: warehouse.warehouseId,
              productId: editingId,
              quantity: form.currentQuantity,
              notes: 'Manager manual adjustment via Stock Management'
            });
          }

          // 2. Update Metadata but protect the global quantity
          // Fetch fresh global total to avoid overwriting the aggregate with the hub stock
          const globalProduct = await productsApi.getById(editingId);
          const metadataPayload = {
            ...form,
            currentQuantity: globalProduct.currentQuantity
          };
          await productsApi.update(editingId, metadataPayload);
        } else {
          // No warehouse selected (unlikely for MANAGER), fallback to direct update
          await productsApi.update(editingId, form);
        }
        showToast.success('Product specifications updated.');
      } else {
        await productsApi.create(form);
        showToast.success('New product added to catalog.');
      }
      resetForm();
      refresh();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || 'Synchronization failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hubPath = (id: number) => role === Role.MANAGER ? `/manager/products/${id}` : `/warehouse/products/${id}`;

  return (
    <div className="w-full space-y-12 pb-20 text-left">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {role === Role.MANAGER ? 'Inventory' : 'Location Stock'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {warehouse && (
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {warehouse.location} · {((warehouse.usedCapacity / warehouse.capacity) * 100).toFixed(1)}% Capacity
              </p>
            )}
            {warehouses.length === 1 && (
              <>
                <div className="h-4 w-px bg-border/40" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-foreground">{filtered.length}</span>
                  <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-status-error">{filtered.filter(p => p.isLowStock).length}</span>
                  <span className="text-[9px] font-black text-status-error/40 uppercase tracking-widest">Critical</span>
                </div>
              </>
            )}
            {warehouses.length > 1 && !warehouse && (
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Global View ({warehouses.length} Locations)
              </p>
            )}
          </div>
        </div>

        <div className="flex p-2 bg-card/30 rounded-full border border-border shadow-app-card backdrop-blur-md h-fit">
          <button
            onClick={resetForm}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'catalogue' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBasket01Icon className="w-5 h-5" />
            Inventory
          </button>
          {isManager && (
            <button
              onClick={() => setActiveTab('registration')}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
                activeTab === 'registration' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusSignIcon className="w-5 h-5" />
              {editingId ? 'Edit Product' : 'New Product'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'registration' && isManager ? (
        /* ── Add New Product Section ───────────────────────────────────────── */
        <div className="max-w-5xl space-y-12">
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              {editingId ? <Edit02Icon className="w-6 h-6" /> : <PlusSignIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{editingId ? 'Edit Product' : 'New Product'}</h2>
              <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider mt-1">
                {editingId ? `Editing product ${form.name}` : 'Add a new product to the catalog'}
              </p>
            </div>
          </div>

          {warehouse && (
            <div className="mx-2 p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <InformationCircleIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none">Location Specific Context: {warehouse.name}</p>
                <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider">
                  You are managing inventory for this specific location. Stock adjustments will be recorded as stock movements.
                  Core product specifications remain synchronized globally.
                </p>
              </div>
            </div>
          )}

          <div className="px-2">
            <form onSubmit={save} className="space-y-10">
              <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10 shadow-app-card">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Name field (Full Width) */}
                  <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Product Name <span className="text-status-error">*</span>
                    </label>
                    <div className="relative group">
                      <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-lg font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="ENTER PRODUCT NAME"
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      SKU <span className="text-status-error">*</span>
                    </label>
                    <div className="relative group">
                      <Tag01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="SKU-CODE"
                        value={form.sku}
                        onChange={(e) => updateForm("sku", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Barcode
                    </label>
                    <div className="relative group">
                      <BarCode01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="ENTER BARCODE"
                        value={form.barcode}
                        onChange={(e) => updateForm("barcode", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Category <span className="text-status-error">*</span>
                    </label>
                    <div className="relative group">
                      <Grid02Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="CATEGORY"
                        value={form.category}
                        onChange={(e) => updateForm("category", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Unit <span className="text-status-error">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 px-6 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                        value={form.unitOfMeasure}
                        onChange={(e) => updateForm("unitOfMeasure", e.target.value)}
                      >
                        <option value="PCS">PIECES (PCS)</option>
                        <option value="KG">KILOGRAMS (KG)</option>
                        <option value="M">METERS (M)</option>
                        <option value="L">LITERS (L)</option>
                        <option value="BOX">BOXES (BOX)</option>
                      </select>
                      <ArrowDown01Icon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none opacity-40" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Cost Price
                    </label>
                    <div className="relative group">
                      <Money01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        step="0.01"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="0.00"
                        value={form.costPrice || ''}
                        onChange={(e) => updateForm("costPrice", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Selling Price
                    </label>
                    <div className="relative group">
                      <Money01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        step="0.01"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="0.00"
                        value={form.sellingPrice || ''}
                        onChange={(e) => updateForm("sellingPrice", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Reorder Level
                    </label>
                    <div className="relative group">
                      <ChartUpIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="MIN QTY"
                        value={form.reorderLevel || ''}
                        onChange={(e) => updateForm("reorderLevel", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Lead Time (Days)
                    </label>
                    <div className="relative group">
                      <InformationCircleIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="DAYS"
                        value={form.leadTimeDays || ''}
                        onChange={(e) => updateForm("leadTimeDays", e.target.value)}
                      />
                    </div>
                  </div>

                  {editingId && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-status-error uppercase tracking-wider px-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-error" />
                        Warehouse Stock Adjustment
                      </label>
                      <div className="relative group">
                        <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-status-error/60" />
                        <input
                          type="number"
                          className="h-14 w-full rounded-2xl border border-status-error/20 bg-status-error/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-status-error/10 outline-none transition-all text-status-error"
                          placeholder="CURRENT QTY"
                          value={form.currentQuantity ?? 0}
                          onChange={(e) => updateForm("currentQuantity", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-8">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-10 h-14 rounded-full border border-border bg-card hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-wider transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-app-subtle shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : editingId ? 'SAVE CHANGES' : 'ADD PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ── Inventory Catalogue Section ───────────────────────────── */
        <div className="space-y-12">
          {/* Warehouse Switcher (Relocated above the catalogue) */}

          {/* Search & Filter Bar */}
          <div className="flex flex-col items-center justify-center gap-10 w-full py-4">
            <div className="flex items-center gap-4 w-full max-w-4xl">
              <div className="relative group flex-1">
                <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="Search inventory by name, SKU or category…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className={cn(
                  "flex items-center gap-3 px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border shadow-app-subtle shrink-0",
                  inStockOnly
                    ? "bg-primary text-white border-primary shadow-primary/20"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <PackageIcon className="w-5 h-5" />
                {inStockOnly ? "In-Stock Only" : "All Products"}
              </button>

              <button
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={cn(
                  "flex items-center gap-3 px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border shadow-app-subtle shrink-0",
                  lowStockOnly
                    ? "bg-status-error text-white border-status-error shadow-status-error/20"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <FilterIcon className="w-5 h-5" />
                {lowStockOnly ? "Low Stock" : "All Inventory"}
              </button>

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

          <div className="flex justify-center relative z-40">
            {warehouses.length > 1 && (
              <div className="w-full max-w-4xl relative group rounded-[2rem] p-[1px] bg-gradient-to-br from-primary/20 via-transparent to-primary/5 shadow-app-subtle hover:shadow-app-hover">
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-10 py-5 rounded-[1.9rem] bg-card/60 backdrop-blur-2xl">
                  {/* Left: Hub Information & Stats */}
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <PackageIcon className="w-7 h-7" />
                        {filtered.filter(p => p.isLowStock).length > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-status-error border-2 border-background flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-pulse">
                            {filtered.filter(p => p.isLowStock).length}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/80">
                          {warehouse ? `${warehouse.name} Context` : 'Global View'}
                        </p>
                        <div className="h-3 w-px bg-primary/20" />
                        <span className="px-2 py-0.5 rounded-md bg-primary text-[7px] font-black uppercase tracking-widest text-primary-foreground">Active</span>
                      </div>

                      <div className="flex items-center gap-10">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black tracking-tighter text-foreground leading-none">{filtered.length}</span>
                          <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Total</span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black tracking-tighter text-status-error leading-none">{filtered.filter(p => p.isLowStock).length}</span>
                          <span className="text-[8px] font-black text-status-error/60 uppercase tracking-widest mt-1 animate-pulse">Critical</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Divider for Desktop */}
                  <div className="hidden md:block h-12 w-px bg-border/40" />

                  {/* Right: Warehouse Switcher (Integrated) */}
                  <div className="relative z-20">
                    <div
                      className="flex items-center gap-4 cursor-pointer group/selector bg-primary/5 hover:bg-primary/10 px-6 py-3 rounded-2xl border border-primary/10 transition-all min-w-[240px]"
                      onClick={() => setIsWarehouseDropdownOpen(!isWarehouseDropdownOpen)}
                    >
                      <WarehouseIcon className="w-4 h-4 text-primary opacity-60 group-hover/selector:opacity-100 transition-opacity" />
                      <div className="flex flex-col flex-1">
                        <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] leading-none mb-1">Location</p>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-foreground tracking-tight">
                            {warehouse?.name || 'Change Location'}
                          </p>
                          <ArrowDown01Icon className={cn("w-3.5 h-3.5 text-primary transition-transform duration-500", isWarehouseDropdownOpen && "rotate-180")} />
                        </div>
                      </div>
                    </div>

                    {isWarehouseDropdownOpen && (
                      <div className="absolute top-full mt-3 right-0 z-50 w-full min-w-[280px] bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-3">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest p-4 border-b border-border/10 mb-2">All Locations</p>
                        <div className="space-y-1 max-h-[260px] overflow-y-auto custom-scrollbar">
                          {warehouses.map(w => (
                            <button
                              key={w.warehouseId}
                              onClick={() => {
                                setSelectedWarehouse(w);
                                setIsWarehouseDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left group/item",
                                warehouse?.warehouseId === w.warehouseId
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted/50 text-foreground/70 hover:text-foreground"
                              )}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-bold group-hover/item:translate-x-1 transition-transform">{w.name}</span>
                                <span className="text-[9px] uppercase tracking-wider opacity-60 mt-0.5">{w.location}</span>
                              </div>
                              {warehouse?.warehouseId === w.warehouseId && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center gap-6">
              <div className="w-10 h-10 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Loading inventory…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center space-y-6 bg-muted/5 rounded-[2.5rem] border border-dashed border-border/60">
              <PackageIcon className="w-12 h-12 text-muted-foreground/10 mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-bold text-foreground">
                  {products.length === 0 ? 'No inventory in this location' : 'No matches found'}
                </p>
                <p className="text-xs text-foreground/70 uppercase tracking-wider font-medium">
                  {products.length === 0
                    ? 'Stock will appear here once goods are received.'
                    : 'Adjust query parameters.'
                  }
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(p => (
                <div key={p.productId} onClick={() => navigate(hubPath(p.productId))}
                  className="group relative flex flex-col p-5 bg-card/60 backdrop-blur-sm border border-border/60 hover:border-primary/40 rounded-[2rem] shadow-sm hover:shadow-app-card cursor-pointer overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors duration-700" />

                  <div className="flex items-start justify-between mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700 shadow-inner">
                      <PackageIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="px-3 py-1 rounded-full bg-muted/30 border border-border text-[8px] font-black text-foreground/40 uppercase tracking-widest">{p.category}</span>
                      {p.isLowStock && (
                        <span className="px-3 py-1 rounded-full bg-status-error/10 border border-status-error/20 text-[8px] font-black text-status-error uppercase tracking-widest animate-pulse">
                          CRITICAL
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-5 relative z-10">

                    <h3 className="font-bold text-lg leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors duration-500 line-clamp-1">
                      {p.name}
                    </h3>
                  </div>

                  <div className="space-y-2.5 relative z-10">
                    <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border/10">
                      <div className="space-y-0.5">
                        <p className="text-[7.5px] font-black text-muted-foreground/40 uppercase tracking-widest">Stock</p>
                        <p className={cn('text-base font-black tabular-nums tracking-tighter', p.isLowStock ? 'text-status-error' : 'text-foreground')}>
                          {p.hubQty} <span className="text-[6.5px] uppercase opacity-30 ml-0.5 font-bold">{p.unitOfMeasure}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-[7.5px] font-black text-muted-foreground/40 uppercase tracking-widest">Value</p>
                        <p className="text-sm font-black tabular-nums tracking-tighter text-foreground/70 group-hover:text-foreground transition-colors">
                          {formatCurrency(p.hubQty * p.sellingPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-2.5 border-t border-border/5 relative z-10">
                    {isManager && (
                      <button onClick={e => { e.stopPropagation(); openEdit(p); }} className="w-6 h-6 flex items-center justify-center rounded-lg text-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-300">
                        <Edit02Icon className="w-3 h-3" />
                      </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <ArrowRight01Icon className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-[2rem] shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/60 h-16">
                    <TableHead className="px-8 text-[12px] font-black text-foreground/60 uppercase tracking-[0.2em]">Product</TableHead>
                    <TableHead className="px-8 text-[12px] font-black text-foreground/60 uppercase tracking-[0.2em]">Category</TableHead>
                    <TableHead className="px-8 text-[12px] font-black text-foreground/60 uppercase tracking-[0.2em]">Stock Level</TableHead>
                    <TableHead className="px-8 text-[12px] font-black text-foreground/60 uppercase tracking-[0.2em]">Price</TableHead>
                    <TableHead className="px-8 text-[12px] font-black text-foreground/60 uppercase tracking-[0.2em] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.productId} onClick={() => navigate(hubPath(p.productId))}
                      className="group hover:bg-primary/[0.01] cursor-pointer border-b border-border/10 h-24">
                      <TableCell className="px-6">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                            <PackageIcon className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">

                            <span className="font-bold text-2xl block leading-tight tracking-tight group-hover:text-primary transition-colors duration-500">{p.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <span className="px-6 py-2.5 rounded-full bg-muted/60 border border-border text-xs font-black text-foreground/80 uppercase tracking-widest">{p.category}</span>
                      </TableCell>
                      <TableCell className="px-6">
                        <div className={cn(
                          "inline-flex items-center gap-4 px-5 py-2 rounded-full border text-sm font-black uppercase tracking-widest transition-all ",
                          p.isLowStock
                            ? "bg-status-error/10 text-status-error border-status-error/40"
                            : "bg-primary/5 text-primary border-primary/30"
                        )}>
                          <div className={cn("w-2.5 h-2.5 rounded-full", p.isLowStock ? "bg-status-error animate-pulse shadow-[0_0_10px_rgba(var(--status-error),0.8)]" : "bg-primary/80")} />
                          {p.hubQty.toLocaleString()} <span className="opacity-40 text-xs">{p.unitOfMeasure}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <span className="text-xl font-black tabular-nums tracking-tighter text-foreground group-hover:text-primary transition-colors">{formatCurrency(p.hubQty * p.sellingPrice)}</span>
                      </TableCell>
                      <TableCell className="px-8 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-5">
                          {isManager && (
                            <button onClick={() => openEdit(p)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary/5 text-primary/80 hover:text-primary hover:bg-primary/10 transition-all duration-300">
                              <Edit02Icon className="w-5 h-5" />
                            </button>
                          )}
                          <div className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-primary/5 transition-all duration-300 group-hover:translate-x-1">
                            <ArrowRight01Icon className="w-6 h-6 text-muted-foreground/20 group-hover:text-primary transition-all duration-500" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
