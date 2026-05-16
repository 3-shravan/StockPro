import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
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
import { warehousesApi } from '@/features/warehouses/api';
import type { Product, ProductRequest } from '@/features/products/types';
import type { StockLevel } from '@/features/warehouses/types';
import { cn, formatCurrency } from "@/lib/utils";
import { useAuthStore } from '@/stores/auth.store';
import { WarehouseSelect } from '@/components/common/WarehouseSelect';

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
  active: true,
};

type TabType = 'list' | 'add';

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

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [hubName, setHubName] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>((location.state as any)?.filter === 'LOW_STOCK');
  const [form, setForm] = useState<ProductRequest>(emptyProduct);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const hubId = searchParams.get('hubId');

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
      let allProducts = await productsApi.getAll();

      if (hubId) {
        const hubIdNum = Number(hubId);
        const [hubStock, hubDetails] = await Promise.all([
          warehousesApi.getAllStockByWarehouse(hubIdNum).catch(() => []),
          warehousesApi.getById(hubIdNum).catch(() => null)
        ]);

        if (hubDetails) {
          setHubName(hubDetails.name);
        }

        // Map hub-specific stock to product list
        const stockMap = new Map<number, number>(hubStock.map((s: StockLevel) => [s.productId, s.quantity]));

        allProducts = allProducts.map(p => ({
          ...p,
          currentQuantity: stockMap.get(p.productId) ?? 0
        }));

        // Optional: Filter to only show products relevant to this hub?
        // User request "View Hub Inventory" implies seeing what's there.
        // But it's better to show all SKUs with 0 if they don't exist in the hub but are in the catalog.
      } else {
        setHubName(null);
      }

      setProducts(allProducts);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [hubId]);

  useEffect(() => {
    const state = location.state as { editProductId?: number };
    if (state?.editProductId && products.length > 0) {
      const productToEdit = products.find(p => p.productId === state.editProductId);
      if (productToEdit) {
        edit(productToEdit);
        // Clear state to prevent re-triggering
        navigate(location.pathname + location.search, { replace: true, state: {} });
      }
    }
  }, [location.state, products]);

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
    if (activeTab === 'add') setActiveTab('list');
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
      active: product.active ?? true,
    });
    setActiveTab('add');
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
        // If in a hub context, we handle stock synchronization through the Warehouse Service
        // to ensure movements are recorded and alerts are triggered.
        if (hubId) {
          const productInList = products.find(p => p.productId === editingId);
          const oldHubStock = productInList?.currentQuantity ?? 0;

          if (form.currentQuantity !== oldHubStock) {
            await warehousesApi.updateStock({
              warehouseId: Number(hubId),
              productId: editingId,
              quantity: form.currentQuantity,
              notes: 'Manual inventory adjustment via Location Inventory'
            });
            // Note: warehousesApi.updateStock will automatically trigger a delta-sync
            // to the product-service to update the global total.
          }

          // Before updating metadata, we fetch the fresh global quantity
          // to ensure our metadata update doesn't overwrite the global sync with the location quantity.
          const globalProduct = await productsApi.getById(editingId);
          const metadataPayload = {
            ...form,
            currentQuantity: globalProduct.currentQuantity
          };
          await productsApi.update(editingId, metadataPayload);
        } else {
          // Global context: Direct update to product list
          await productsApi.update(editingId, form);
        }
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
          <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">
            {hubName ? `${hubName} Inventory` : 'Inventory'}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground text-left">
            {hubName ? 'Warehouse Stock' : 'Products'}
          </h1>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          {user?.role === 'ADMIN' && activeTab === 'list' && (
            <div className="flex items-center gap-2 px-6 h-14 bg-card/30 rounded-full border border-border shadow-app-subtle backdrop-blur-md">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Context</p>
              <WarehouseSelect
                value={Number(hubId) || 0}
                onChange={(id) => {
                  if (id === 0) {
                    navigate(location.pathname);
                  } else {
                    navigate(`${location.pathname}?hubId=${id}`);
                  }
                }}
                placeholder="All Locations"
                className="w-48 !border-none !bg-transparent !shadow-none !h-10"
              />
            </div>
          )}

          <div className="flex p-2 bg-card/30 rounded-full border border-border shadow-app-card backdrop-blur-md h-fit">
            <button
              onClick={() => { setActiveTab('list'); reset(); }}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
                activeTab === 'list' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShoppingBasket01Icon className="w-5 h-5" />
              Products
            </button>
            {isManagerOrAdmin && (
              <button
                onClick={() => setActiveTab('add')}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
                  activeTab === 'add' ? "bg-primary text-primary-foreground shadow-app-subtle" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <PlusSignIcon className="w-5 h-5" />
                {editingId ? 'Edit Product' : 'Add Product'}
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
      </div>

      {activeTab === 'list' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center justify-center gap-6 w-full py-4">
            <div className="flex items-center gap-4 w-full max-w-4xl">
              <div className="relative group flex-1">
                <Search01Icon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  className="h-16 w-full rounded-2xl border border-border bg-card/50 pl-16 pr-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                  placeholder="Search products by name, SKU, category or brand..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={cn(
                  "flex items-center gap-3 px-8 h-16 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border shadow-app-subtle shrink-0",
                  lowStockOnly
                    ? "bg-status-error text-white border-status-error/50 shadow-status-error/20"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <FilterIcon className="w-5 h-5" />
                {lowStockOnly ? "Low Stock" : hubId ? "Warehouse Inventory" : "All Inventory"}
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
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={PackageIcon}
              title="No Products Found"
              description="No products match your current filters or search query."
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product) => (
                <div
                  key={product.productId}
                  onClick={() => navigate(getProductPath(product.productId))}
                  className="group relative aspect-[4/5] flex flex-col p-8 bg-card border border-border/60 hover:border-primary/40 rounded-[3rem] transition-all duration-700 text-left shadow-app-card hover:shadow-app-hover hover:-translate-y-2 overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-colors" />

                  <div className="flex items-start justify-between mb-auto relative">
                    <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      <PackageIcon className="w-7 h-7" />
                    </div>
                    {product.currentQuantity <= product.reorderLevel && (
                      <span className="text-[8px] font-black px-3 py-1 bg-status-error/10 text-status-error uppercase tracking-widest rounded-full border border-status-error/20 animate-pulse">
                        CRITICAL
                      </span>
                    )}
                    {product.currentQuantity >= product.maxStockLevel && product.maxStockLevel > 0 && (
                      <span className="text-[8px] font-black px-3 py-1 bg-amber-500/10 text-amber-500 uppercase tracking-widest rounded-full border border-amber-500/20">
                        OVERSTOCK
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-6 relative">

                    <h3 className="font-black text-xl leading-tight tracking-tighter group-hover:text-primary transition-colors pt-2 line-clamp-2">{product.name}</h3>
                  </div>

                  <div className="space-y-6 mt-auto relative">
                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border/10">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest leading-none">Stock</p>
                        <p className={cn(
                          "text-2xl font-black tabular-nums tracking-tighter leading-none pt-1",
                          product.currentQuantity <= product.reorderLevel ? "text-status-error" :
                            (product.currentQuantity >= product.maxStockLevel && product.maxStockLevel > 0) ? "text-amber-500" : "text-foreground"
                        )}>
                          {product.currentQuantity} <span className="text-[10px] font-bold opacity-30 ml-0.5 uppercase">{product.unitOfMeasure}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1.5">
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest leading-none">Price</p>
                        <p className="text-2xl font-black tabular-nums tracking-tighter leading-none pt-1 group-hover:text-primary transition-colors">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end pt-2">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500 border border-transparent group-hover:border-primary/20">
                        <ArrowRight01Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-[2.5rem] shadow-app-card overflow-hidden backdrop-blur-sm bg-opacity-50">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/60 h-14">
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Product</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Category</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Stock Level</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider">Price</TableHead>
                    <TableHead className="px-10 font-black text-[10px] text-foreground/70 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => (
                    <TableRow
                      key={product.productId}
                      className="group hover:bg-primary/[0.02] transition-all cursor-pointer border-b border-border/10 h-20"
                      onClick={() => navigate(getProductPath(product.productId))}
                    >
                      <TableCell className="px-10">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                            <PackageIcon className="w-6 h-6" />
                          </div>
                          <div className="text-left">

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
                            ? "bg-status-error/10 text-status-error border-status-error/20"
                            : (product.currentQuantity >= product.maxStockLevel && product.maxStockLevel > 0)
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                        )}>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            product.currentQuantity <= product.reorderLevel ? "bg-status-error animate-pulse" :
                              (product.currentQuantity >= product.maxStockLevel && product.maxStockLevel > 0) ? "bg-amber-500" : "bg-primary"
                          )} />
                          {product.currentQuantity.toLocaleString()} {product.unitOfMeasure} {product.currentQuantity >= product.maxStockLevel && product.maxStockLevel > 0 ? 'FULL' : 'IN STOCK'}
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

      {activeTab === 'add' && (
        <div className="max-w-5xl space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              {editingId ? <Edit02Icon className="w-6 h-6" /> : <PlusSignIcon className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{editingId ? 'Edit Product' : 'New Product'}</h2>
              <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mt-1">
                {editingId ? `Editing product ${form.name}` : 'Add a new product to the list'}
              </p>
            </div>
          </div>

          {hubId && (
            <div className="mx-2 p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <InformationCircleIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none">Location View Active: {hubName}</p>
                <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-wider">
                  You are editing this product within the context of a specific location. Quantity adjustments will target this location specifically.
                  Metadata changes (Name, Price, etc.) remain global.
                </p>
              </div>
            </div>
          )}

          <div className="px-2">
            <form onSubmit={save} className="space-y-10">
              <div className="bg-card/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-border/40 space-y-10">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                        onChange={(e) => update("name", e.target.value)}
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
                        onChange={(e) => update("sku", e.target.value)}
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
                        onChange={(e) => update("barcode", e.target.value)}
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
                        onChange={(e) => update("category", e.target.value)}
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
                        onChange={(e) => update("costPrice", e.target.value)}
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
                        onChange={(e) => update("sellingPrice", e.target.value)}
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
                        onChange={(e) => update("reorderLevel", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/70 uppercase tracking-wider px-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Max Stock Level
                    </label>
                    <div className="relative group">
                      <ChartUpIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        className="h-14 w-full rounded-2xl border border-border bg-muted/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="MAX QTY"
                        value={form.maxStockLevel || ''}
                        onChange={(e) => update("maxStockLevel", e.target.value)}
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
                        onChange={(e) => update("leadTimeDays", e.target.value)}
                      />
                    </div>
                  </div>

                  {editingId && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-status-error uppercase tracking-wider px-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-error" />
                        Manual Stock Adjustment
                      </label>
                      <div className="relative group">
                        <PackageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-status-error/60" />
                        <input
                          type="number"
                          className="h-14 w-full rounded-2xl border border-status-error/20 bg-status-error/5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-status-error/10 outline-none transition-all text-status-error"
                          placeholder="CURRENT QTY"
                          value={form.currentQuantity ?? 0}
                          onChange={(e) => update("currentQuantity", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
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
                  {isSubmitting ? 'SAVING...' : editingId ? 'SAVE CHANGES' : 'ADD PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
