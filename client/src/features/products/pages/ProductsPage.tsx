import { useEffect, useMemo, useState } from 'react';
import { 
  Delete02Icon, 
  Edit02Icon, 
  Search01Icon, 
  PlusSignIcon, 
  PackageIcon, 
  Grid02Icon, 
  Tag01Icon, 
  Money01Icon, 
  ChartUpIcon,
  ShoppingBasket01Icon,
  BarCode01Icon,
  InformationCircleIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showToast } from '@/lib/toast';
import { productsApi } from '@/features/products/api';
import type { Product, ProductRequest } from '@/features/products/types';
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore } from '@/stores/auth.store';
import { useLocation } from 'react-router-dom';

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

export const ProductsPage = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<TabType>('catalogue');
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

  const update = (field: keyof ProductRequest, value: string) => {
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

  const remove = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    try {
      await productsApi.delete(product.productId);
      showToast.success('Product deleted.');
      await loadProducts();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Unable to delete product.');
    }
  };

  return (
    <section className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Product Catalogue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your inventory items, pricing, and stock thresholds.
          </p>
        </div>

        <div className="flex p-1 bg-muted/50 rounded-2xl w-fit border border-border/50">
          <button
            onClick={() => { setActiveTab('catalogue'); reset(); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'catalogue' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBasket01Icon className="w-4 h-4" />
            Catalogue
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab('registration')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === 'registration' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PlusSignIcon className="w-4 h-4" />
              {editingId ? 'Edit Product' : 'New Product'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'catalogue' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative group max-w-md w-full">
                  <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-12 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    placeholder="Search by name, SKU, or category..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                   <button
                    onClick={() => setLowStockOnly(!lowStockOnly)}
                    className={cn(
                      "flex items-center gap-2 px-4 h-12 rounded-2xl text-xs font-bold transition-all border",
                      lowStockOnly 
                        ? "bg-destructive/10 text-destructive border-destructive/20 shadow-sm shadow-destructive/5" 
                        : "bg-background text-muted-foreground border-input/60 hover:border-primary/30"
                    )}
                   >
                     <InformationCircleIcon className={cn("w-4 h-4", lowStockOnly ? "text-destructive" : "text-muted-foreground")} />
                     LOW STOCK ONLY
                   </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="col-span-full py-20 text-center text-muted-foreground">Loading catalogue...</p>
            ) : filtered.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-muted/20 rounded-4xl border border-dashed border-border">
                <p className="text-muted-foreground">No products found.</p>
              </div>
            ) : (
              filtered.map((product) => (
                <Card 
                  key={product.productId} 
                  className="rounded-3xl border-transparent bg-card/80 hover:bg-card shadow-sm transition-all group overflow-hidden cursor-pointer active:scale-[0.98]"
                  onClick={() => isManagerOrAdmin && edit(product)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <PackageIcon className="w-6 h-6" />
                      </div>
                      {isManagerOrAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => edit(product)}
                            className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Details"
                          >
                            <Edit02Icon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => void remove(product)}
                            className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete Product"
                          >
                            <Delete02Icon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <h3 className="font-bold text-lg truncate">{product.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                          {product.category}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-primary/5 rounded-md text-primary">
                          SKU: {product.sku}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Current Stock</p>
                        <p className="text-xl font-bold mt-1">
                          {product.currentQuantity} <span className="text-xs font-medium text-muted-foreground">{product.unitOfMeasure}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Price</p>
                        <p className="text-xl font-bold mt-1 text-primary">
                          ${product.sellingPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {product.currentQuantity <= product.reorderLevel && (
                      <div className="mt-4 flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <InformationCircleIcon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Low Stock Alert</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'registration' && (
        <Card className="max-w-4xl mx-auto rounded-4xl border-transparent bg-card/80 shadow-sm border-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8 pt-8 px-10 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                {editingId ? <Edit02Icon className="w-6 h-6 text-primary" /> : <PlusSignIcon className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <CardTitle className="text-xl">{editingId ? 'Edit Product Details' : 'Register New Product'}</CardTitle>
                <CardDescription>
                  {editingId ? `Update information for ${form.name}` : 'Add a new item to your master product list.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={save} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Product Name <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Descriptive name of the product as it should appear in invoices." />
                  </label>
                  <div className="relative group">
                    <PackageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. Wireless Ergonomic Mouse"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    SKU Code <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Stock Keeping Unit - unique identifier for inventory tracking." />
                  </label>
                  <div className="relative group">
                    <Tag01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. MOUSE-WL-001"
                      value={form.sku}
                      onChange={(e) => update("sku", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Barcode / QR
                    <InfoTooltip content="UPC, EAN or QR code for physical scanning." />
                  </label>
                  <div className="relative group">
                    <BarCode01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="012345678912"
                      value={form.barcode}
                      onChange={(e) => update("barcode", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Category <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="Group products for easier reporting and filtering." />
                  </label>
                  <div className="relative group">
                    <Grid02Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. Peripherals"
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Unit of Measure <span className="text-destructive ml-1">*</span>
                    <InfoTooltip content="How this item is counted (e.g. PCS, KG, BOX)." />
                  </label>
                  <select
                    className="h-12 w-full rounded-2xl border border-input/60 bg-background px-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    value={form.unitOfMeasure}
                    onChange={(e) => update("unitOfMeasure", e.target.value)}
                  >
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="KG">Kilograms (KG)</option>
                    <option value="M">Meters (M)</option>
                    <option value="L">Liters (L)</option>
                    <option value="BOX">Box (BOX)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Cost Price
                    <InfoTooltip content="Purchase price from supplier per unit." />
                  </label>
                  <div className="relative group">
                    <Money01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="number"
                      step="0.01"
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="0.00"
                      value={form.costPrice || ''}
                      onChange={(e) => update("costPrice", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Selling Price
                    <InfoTooltip content="Price at which this item is sold to customers." />
                  </label>
                  <div className="relative group">
                    <Money01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="number"
                      step="0.01"
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="0.00"
                      value={form.sellingPrice || ''}
                      onChange={(e) => update("sellingPrice", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Reorder Level
                    <InfoTooltip content="Minimum stock level before a low-stock alert is triggered." />
                  </label>
                  <div className="relative group">
                    <ChartUpIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="number"
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. 10"
                      value={form.reorderLevel || ''}
                      onChange={(e) => update("reorderLevel", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium px-1 flex items-center">
                    Lead Time (Days)
                    <InfoTooltip content="Expected days to receive stock after ordering from supplier." />
                  </label>
                  <div className="relative group">
                    <InformationCircleIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                    <input
                      type="number"
                      className="h-12 w-full rounded-2xl border border-input/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                      placeholder="e.g. 7"
                      value={form.leadTimeDays || ''}
                      onChange={(e) => update("leadTimeDays", e.target.value)}
                    />
                  </div>
                </div>

                {editingId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium px-1 flex items-center text-primary">
                      Stock Correction (Global)
                      <InfoTooltip content="CRITICAL: Manually override global pieces. Use only to fix sync errors." />
                    </label>
                    <div className="relative group">
                      <PackageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary group-focus-within:text-primary" />
                      <input
                        type="number"
                        className="h-12 w-full rounded-2xl border-primary/40 border bg-primary/5 pl-10 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold"
                        placeholder="e.g. 400"
                        value={form.currentQuantity ?? 0}
                        onChange={(e) => update("currentQuantity", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/20">
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Product' : 'Register Product'}
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
    </section>
  );
};
