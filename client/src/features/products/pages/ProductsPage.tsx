import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  PlusSignIcon, 
  PackageIcon, 
  Tag01Icon, 
  BarCode01Icon, 
  Grid02Icon, 
  Money01Icon, 
  ChartUpIcon, 
  InformationCircleIcon,
  LayoutGridIcon,
  TableIcon,
  ArrowRight01Icon,
  Edit02Icon,
  Search01Icon,
  ShoppingBasket01Icon,
  FilterIcon,
  PackageMovingIcon
} from 'hugeicons-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { showToast } from '@/lib/toast';
import { productsApi } from '@/features/products/api';
import type { Product, ProductRequest } from '@/features/products/types';
import { cn, formatCurrency } from "@/lib/utils";
import { useAuthStore } from '@/stores/auth.store';

const emptyProduct: ProductRequest = {
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
  imageUrl: '',
  barcode: '',
  currentQuantity: 0,
};

type TabType = 'catalogue' | 'registration';

const ArrowDown01Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const location = useLocation();
  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  
  const getProductPath = (id: number) => {
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') return `/manager/products/${id}`;
    if (user?.role === 'OFFICER') return `/purchase/products/${id}`;
    return `/warehouse/products/${id}`;
  };

  const [activeTab, setActiveTab] = useState<TabType>('catalogue');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>((location.state as any)?.filter === 'LOW_STOCK');
  const [form, setForm] = useState<ProductRequest>(emptyProduct);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let result = products;
    if (lowStockOnly) {
      result = result.filter(p => p.currentQuantity <= p.reorderLevel);
    }
    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter((product) =>
      [product.name, product.sku, product.category, product.brand, product.barcode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [products, query, lowStockOnly]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await productsApi.getAll());
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const update = (field: keyof ProductRequest, value: string | number) => {
    const numericFields = ['costPrice', 'sellingPrice', 'reorderLevel', 'maxStockLevel', 'leadTimeDays', 'currentQuantity'];
    setForm((current) => ({
      ...current,
      [field]: numericFields.includes(field) ? Number(value) : value,
    }));
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptyProduct);
    if (activeTab === 'registration') setActiveTab('catalogue');
  };

  const edit = (product: Product) => {
    setEditingId(product.productId);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      category: product.category,
      brand: product.brand ?? '',
      unitOfMeasure: product.unitOfMeasure,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel,
      maxStockLevel: product.maxStockLevel,
      leadTimeDays: product.leadTimeDays,
      imageUrl: product.imageUrl ?? '',
      barcode: product.barcode ?? '',
      currentQuantity: product.currentQuantity ?? 0,
    });
    setActiveTab('registration');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.category || !form.unitOfMeasure) {
      showToast.error('Please fill in all required fields (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await productsApi.update(editingId, form);
        showToast.success('Product updated.');
      } else {
        await productsApi.create(form);
        showToast.success('Product created.');
      }
      reset();
      await loadProducts();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Unable to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Inventory Catalogue</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-left">
            Stock Protocols
          </h1>
        </div>

        <div className="flex p-2 bg-card/30 rounded-full border border-border shadow-app-card backdrop-blur-md">
          <button
            onClick={() => { setActiveTab('catalogue'); reset(); }}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeTab === 'catalogue' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBasket01Icon className="w-5 h-5" />
            Catalogue
          </button>
          {isManagerOrAdmin && (
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

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/warehouse/issue')}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 text-muted-foreground hover:text-foreground border-l border-border/20 ml-2 pl-4"
            >
              <PackageMovingIcon className="w-5 h-5" />
              Issue Stock
            </button>
          )}
        </div>
      </div>

      {activeTab === 'catalogue' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center justify-center gap-6 w-full py-4">
            <div className="flex items-center gap-4 w-full max-w-4xl">
              <div className="relative group flex-1">
                <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="Search protocols by name, SKU, category or brand..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button 
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={cn(
                  "flex items-center gap-3 px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border shadow-app-subtle shrink-0",
                  lowStockOnly 
                    ? "bg-destructive text-destructive-foreground border-destructive/50 shadow-destructive/20" 
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

          {loading ? (
             <div className="p-32 text-center flex flex-col items-center gap-6">
                <div className="w-12 h-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Decoding SKU Registry...</p>
             </div>
          ) : filtered.length === 0 ? (
            <div className="py-32 text-center space-y-6 bg-muted/5 rounded-[3rem] border border-dashed border-border/60">
                <PackageIcon className="w-16 h-16 text-muted-foreground/10 mx-auto" />
                <div className="space-y-2">
                  <p className="text-xl font-bold text-foreground">No protocols found</p>
                  <p className="text-sm text-foreground/70 uppercase tracking-wider font-medium">Adjust query parameters or register new asset.</p>
                </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filtered.map((product) => (
                <div 
                  key={product.productId} 
                  className="group relative flex flex-col p-8 bg-card border border-border hover:border-primary/40 rounded-[2.5rem] transition-all duration-500 text-left shadow-app-card hover:shadow-app-hover hover:-translate-y-2 cursor-pointer overflow-hidden"
                  onClick={() => navigate(getProductPath(product.productId))}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="flex items-start justify-between mb-10 relative">
                    <div className="w-16 h-16 rounded-3xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                      <PackageIcon className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-black px-4 py-1.5 bg-muted text-foreground/70 uppercase tracking-wider rounded-full border border-border">
                        {product.category}
                      </span>
                      {product.currentQuantity <= product.reorderLevel && (
                        <span className="text-[10px] font-black px-4 py-1.5 bg-destructive/10 text-destructive uppercase tracking-wider rounded-full border border-destructive/20 animate-pulse">
                          CRITICAL
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mb-10 relative">
                    <p className="text-[10px] font-black text-primary uppercase tracking-wider opacity-60">{product.sku}</p>
                    <h3 className="font-bold text-2xl leading-tight tracking-tight group-hover:text-primary transition-colors min-h-[4rem]">{product.name}</h3>
                  </div>

                  <div className="mt-auto space-y-6 relative">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider">Density</p>
                        <p className={cn(
                          "text-xl font-black tabular-nums tracking-tighter",
                          product.currentQuantity <= product.reorderLevel ? "text-destructive" : "text-foreground"
                        )}>
                          {product.currentQuantity} <span className="text-[10px] uppercase opacity-40 ml-1">{product.unitOfMeasure}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-foreground/70 uppercase tracking-wider">Valuation</p>
                        <p className="text-xl font-black tabular-nums tracking-tighter">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out",
                          product.currentQuantity <= product.reorderLevel ? "bg-destructive shadow-[0_0_10px_rgba(var(--destructive),0.5)]" : "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        )}
                        style={{ width: `${Math.min(100, (product.currentQuantity / (product.maxStockLevel || 100)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-border/10">
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {isManagerOrAdmin && (
                          <button onClick={() => edit(product)} className="w-10 h-10 flex items-center justify-center text-primary/60 hover:text-primary transition-all duration-300">
                            <Edit02Icon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                     <ArrowRight01Icon className="w-6 h-6 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-2 transition-all duration-500" />
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
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Density Status</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Valuation</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow 
                      key={product.productId} 
                      className="group hover:bg-primary/[0.02] transition-all cursor-pointer border-b border-border/10 h-28"
                      onClick={() => navigate(getProductPath(product.productId))}
                    >
                      <TableCell className="px-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-3xl bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                            <PackageIcon className="w-8 h-8" />
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-wider opacity-60 block mb-1">{product.sku}</span>
                            <span className="font-bold text-xl block leading-tight tracking-tight group-hover:text-primary transition-colors">{product.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10">
                        <span className="text-[10px] font-black px-4 py-2 bg-muted text-foreground/70 uppercase tracking-wider rounded-full border border-border">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="px-10 text-left">
                        <div className={cn(
                          "inline-flex items-center gap-3 px-6 py-2.5 rounded-full border text-[11px] font-black uppercase tracking-widest",
                          product.currentQuantity <= product.reorderLevel 
                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        )}>
                          <div className={cn("w-2 h-2 rounded-full", product.currentQuantity <= product.reorderLevel ? "bg-destructive animate-pulse" : "bg-emerald-500")} />
                          {product.currentQuantity.toLocaleString()} {product.unitOfMeasure} LEFT
                        </div>
                      </TableCell>
                      <TableCell className="px-10">
                         <span className="text-xl font-black tabular-nums tracking-tighter">
                            {formatCurrency(product.sellingPrice)}
                         </span>
                      </TableCell>
                      <TableCell className="px-10 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-4">
                          {isManagerOrAdmin && (
                            <button onClick={() => edit(product)} className="w-12 h-12 flex items-center justify-center text-primary/60 hover:text-primary transition-all duration-300">
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

      {activeTab === 'registration' && (
        <div className="max-w-5xl space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              {editingId ? <Edit02Icon className="w-6 h-6" /> : <PlusSignIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{editingId ? 'Modify Resource' : 'Asset Initialization'}</h2>
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wider mt-1">
                {editingId ? `RECONFIGURING LOGISTICS STREAM FOR ${form.name}` : 'PROVISIONING NEW SKU RECORD IN THE GLOBAL REGISTRY'}
              </p>
            </div>
          </div>

          <div className="px-2">
            <form onSubmit={save} className="space-y-10">
              <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                        onChange={(e) => update("name", e.target.value)}
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
                        onChange={(e) => update("sku", e.target.value)}
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
                        onChange={(e) => update("barcode", e.target.value)}
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
                        onChange={(e) => update("category", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Registry Unit <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 px-6 text-[10px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                        value={form.unitOfMeasure}
                        onChange={(e) => update("unitOfMeasure", e.target.value)}
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
                        onChange={(e) => update("costPrice", e.target.value)}
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
                        onChange={(e) => update("sellingPrice", e.target.value)}
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
                        onChange={(e) => update("reorderLevel", e.target.value)}
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
                        onChange={(e) => update("leadTimeDays", e.target.value)}
                      />
                    </div>
                  </div>

                  {editingId && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-destructive uppercase tracking-wider px-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        Manual Density Override
                      </label>
                      <div className="relative group">
                        <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive/60" />
                        <input
                          type="number"
                          className="h-14 w-full rounded-2xl border border-destructive/20 bg-destructive/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-destructive/10 outline-none transition-all text-destructive"
                          placeholder="CURRENT QTY"
                          value={form.currentQuantity ?? 0}
                          onChange={(e) => update("currentQuantity", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-border/40">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] shadow-app-subtle shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'SYNCHRONIZING...' : editingId ? 'COMMIT SPECIFICATIONS' : 'AUTHORIZE INITIALIZATION'}
                </button>
                <button 
                  type="button" 
                  onClick={reset}
                  className="px-10 h-14 rounded-full border border-border bg-card hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-wider transition-all"
                >
                  ABORT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
