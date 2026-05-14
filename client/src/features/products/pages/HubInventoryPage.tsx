import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'hugeicons-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useHubInventory } from '../hooks/useHubInventory';
import type { HubProduct } from '../hooks/useHubInventory';
import { productsApi } from '../api';
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

  const { loading, warehouse, products, refresh } = useHubInventory();
  const [activeTab, setActiveTab] = useState<TabType>('catalogue');
  const [query, setQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductRequest>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let r = products;
    if (lowStockOnly) r = r.filter(p => p.isLowStock);
    const q = query.trim().toLowerCase();
    if (!q) return r;
    return r.filter(p =>
      [p.name, p.sku, p.category, p.brand, p.barcode].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    );
  }, [products, query, lowStockOnly]);

  const updateForm = (f: keyof ProductRequest, v: string | number) => {
    const nums = ['costPrice','sellingPrice','reorderLevel','maxStockLevel','leadTimeDays','currentQuantity'];
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
        await productsApi.update(editingId, form); 
        showToast.success('Product specifications updated.'); 
      } else { 
        await productsApi.create(form); 
        showToast.success('New SKU registered in global catalog.'); 
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
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20 text-left">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">
            {warehouse ? `${warehouse.name} · HUB LOGISTICS` : 'HUB LOGISTICS'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {role === Role.MANAGER ? 'Stock Management' : 'My Hub Stock'}
          </h1>
          {warehouse && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {warehouse.location} · Capacity Utilization {((warehouse.usedCapacity / warehouse.capacity) * 100).toFixed(1)}%
            </p>
          )}
        </div>

        <div className="flex p-2 bg-card/30 rounded-full border border-border shadow-app-card backdrop-blur-md">
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
              {editingId ? 'Modify SKU' : 'Register SKU'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'registration' && isManager ? (
        /* ── Registration / Edit Form (Admin-Style Premium UI) ──────────────── */
        <div className="max-w-5xl space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              {editingId ? <Edit02Icon className="w-6 h-6" /> : <PlusSignIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{editingId ? 'Modify Resource' : 'Asset Initialization'}</h2>
              <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider mt-1">
                {editingId ? `RECONFIGURING LOGISTICS STREAM FOR ${form.name}` : 'PROVISIONING NEW SKU RECORD IN THE GLOBAL REGISTRY'}
              </p>
            </div>
          </div>

          <div className="px-2">
            <form onSubmit={save} className="space-y-10">
              <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10 shadow-app-card">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Name field (Full Width) */}
                  <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Resource Identity <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative group">
                      <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-lg font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20"
                        placeholder="OFFICIAL PRODUCT DESIGNATION"
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Protocol SKU <span className="text-rose-400">*</span>
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
                      Registry Barcode
                    </label>
                    <div className="relative group">
                      <BarCode01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="SCAN IDENTITY"
                        value={form.barcode}
                        onChange={(e) => updateForm("barcode", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Classification <span className="text-rose-400">*</span>
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
                      Registry Unit <span className="text-rose-400">*</span>
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
                      Acquisition Evaluation
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
                      Market Evaluation
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
                      Risk Threshold
                    </label>
                    <div className="relative group">
                      <ChartUpIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="MIN. STOCK"
                        value={form.reorderLevel || ''}
                        onChange={(e) => updateForm("reorderLevel", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Supply Lead Period
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
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-wider px-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Hub Density Override
                      </label>
                      <div className="relative group">
                        <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400/60" />
                        <input
                          type="number"
                          className="h-14 w-full rounded-2xl border border-rose-400/20 bg-rose-400/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-rose-400/10 outline-none transition-all text-rose-400"
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
                  ABORT
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-10 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-app-subtle shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'SYNCHRONIZING...' : editingId ? 'COMMIT SPECIFICATIONS' : 'AUTHORIZE INITIALIZATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ── Inventory Catalogue Section ───────────────────────────── */
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Search & Filter Bar */}
          <div className="flex flex-col items-center justify-center gap-6 w-full py-4">
            <div className="flex items-center gap-4 w-full max-w-4xl">
              <div className="relative group flex-1">
                <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="Search hub inventory by name, SKU or category…"
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                />
              </div>

              <button 
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={cn(
                  "flex items-center gap-3 px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border shadow-app-subtle shrink-0",
                  lowStockOnly 
                    ? "bg-rose-400 text-white border-rose-600 shadow-rose-400/20" 
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <FilterIcon className="w-5 h-5" />
                {lowStockOnly ? "Critical Stock" : "All Density"}
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

          {/* Hub Context Banner */}
          {warehouse && (
            <div className="flex items-center justify-between px-8 py-6 rounded-[2rem] bg-primary/5 border border-primary/10 backdrop-blur-sm shadow-app-subtle">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <PackageIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-80">{warehouse.name}</p>
                  <p className="text-sm font-bold text-foreground/80 mt-0.5">
                    {filtered.length} products tracked <span className="mx-2 opacity-20">|</span> 
                    <span className="text-rose-400/60 font-black">{filtered.filter(p=>p.isLowStock).length} RESTOCK REQUIRED</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-4 py-2 rounded-full border border-border">
                HUB-SPECIFIC QUANTITIES
              </span>
            </div>
          )}

          {loading ? (
            <div className="py-32 flex flex-col items-center gap-6">
              <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Decoding Hub Registry…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-32 text-center space-y-6 bg-muted/5 rounded-[3rem] border border-dashed border-border/60">
              <PackageIcon className="w-16 h-16 text-muted-foreground/10 mx-auto" />
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  {products.length === 0 ? 'No inventory in this hub' : 'No matches found'}
                </p>
                <p className="text-sm text-foreground/70 uppercase tracking-wider font-medium">
                  {products.length === 0 
                    ? 'Stock will appear here once goods are received via Purchase Orders.' 
                    : 'Adjust query parameters or register new asset.'
                  }
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filtered.map(p => (
                <div key={p.productId} onClick={() => navigate(hubPath(p.productId))}
                  className="group relative flex flex-col p-8 bg-card border border-border hover:border-primary/40 rounded-[3rem] transition-all duration-700 shadow-app-card hover:shadow-app-hover hover:-translate-y-2 cursor-pointer overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="flex items-start justify-between mb-10 relative">
                    <div className="w-16 h-16 rounded-3xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                      <PackageIcon className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-black px-4 py-1.5 bg-muted text-foreground/70 uppercase tracking-wider rounded-full border border-border">{p.category}</span>
                      {p.isLowStock && (
                        <span className="text-[10px] font-black px-4 py-1.5 bg-rose-400/10 text-rose-400/70 uppercase tracking-wider rounded-full border border-rose-400/20 animate-pulse">
                          CRITICAL
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mb-10 relative">
                    <p className="text-[10px] font-black text-primary uppercase tracking-wider opacity-60">{p.sku}</p>
                    <h3 className="font-bold text-2xl leading-tight tracking-tight group-hover:text-primary transition-colors min-h-[4rem]">{p.name}</h3>
                  </div>

                  <div className="mt-auto space-y-6 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider">Hub Stock</p>
                        <p className={cn('text-2xl font-black tabular-nums tracking-tighter', p.isLowStock ? 'text-rose-400/80' : 'text-foreground')}>
                          {p.hubQty} <span className="text-[10px] uppercase opacity-40 ml-1">{p.unitOfMeasure}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider">Hub Value</p>
                        <p className="text-xl font-black tabular-nums tracking-tighter">
                          {formatCurrency(p.hubQty * p.sellingPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-6 relative">
                    {isManager && (
                      <button onClick={e => { e.stopPropagation(); openEdit(p); }} className="w-10 h-10 flex items-center justify-center text-primary/60 hover:text-primary transition-all duration-300">
                        <Edit02Icon className="w-5 h-5" />
                      </button>
                    )}
                    <ArrowRight01Icon className="w-6 h-6 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-[2.5rem] shadow-app-card overflow-hidden backdrop-blur-sm bg-opacity-50">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/60 h-20">
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Protocol Asset</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Classification</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Hub Stock</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Hub Value</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.productId} onClick={() => navigate(hubPath(p.productId))}
                      className="group hover:bg-primary/[0.02] transition-all cursor-pointer border-b border-border/10 h-28">
                      <TableCell className="px-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-3xl bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                            <PackageIcon className="w-8 h-8" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-wider opacity-60 block mb-1">{p.sku}</span>
                            <span className="font-bold text-xl block leading-tight tracking-tight group-hover:text-primary transition-colors">{p.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10">
                        <span className="text-[10px] font-black px-4 py-2 bg-muted text-foreground/70 uppercase tracking-wider rounded-full border border-border">{p.category}</span>
                      </TableCell>
                      <TableCell className="px-10">
                        <div className={cn(
                          "inline-flex items-center gap-2.5 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all shadow-app-subtle",
                          p.isLowStock 
                            ? "bg-rose-400/5 text-rose-400/80 border-rose-400/20" 
                            : "bg-emerald-500/5 text-emerald-500/80 border-emerald-500/20"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", p.isLowStock ? "bg-rose-400/60 animate-pulse" : "bg-emerald-500/60")} />
                          {p.hubQty.toLocaleString()} {p.unitOfMeasure} LEFT
                        </div>
                      </TableCell>
                      <TableCell className="px-10">
                        <span className="text-xl font-black tabular-nums tracking-tighter">{formatCurrency(p.hubQty * p.sellingPrice)}</span>
                      </TableCell>
                      <TableCell className="px-10 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-4">
                          {isManager && (
                            <button onClick={() => openEdit(p)} className="w-12 h-12 flex items-center justify-center text-primary/60 hover:text-primary transition-all duration-300">
                              <Edit02Icon className="w-6 h-6" />
                            </button>
                          )}
                          <ArrowRight01Icon className="w-8 h-8 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500" />
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
