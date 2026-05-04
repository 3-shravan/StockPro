import { useEffect, useMemo, useState } from 'react';
import { Delete02Icon, Edit02Icon, Search01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showToast } from '@/lib/toast';
import { productsApi } from '@/features/products/api';
import type { Product, ProductRequest } from '@/features/products/types';

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

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<ProductRequest>(emptyProduct);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      [product.name, product.sku, product.category, product.brand, product.barcode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [products, query]);

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
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.category || !form.unitOfMeasure) {
      showToast.error('Name, category, and unit are required.');
      return;
    }

    setSaving(true);
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
      setSaving(false);
    }
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await productsApi.delete(product.productId);
      showToast.success('Product deleted.');
      await loadProducts();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Unable to delete product.');
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Products</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Catalogue, pricing, stock thresholds, barcode lookup, and product search.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>{editingId ? 'Update Product' : 'Create Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="SKU" value={form.sku} onChange={(e) => update('sku', e.target.value)} />
                <input className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Barcode / QR" value={form.barcode} onChange={(e) => update('barcode', e.target.value)} />
              </div>
              <input className="h-11 w-full rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Product name" value={form.name} onChange={(e) => update('name', e.target.value)} />
              <textarea className="min-h-20 w-full rounded-2xl border border-input/60 bg-background px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Category" value={form.category} onChange={(e) => update('category', e.target.value)} />
                <input className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Brand" value={form.brand} onChange={(e) => update('brand', e.target.value)} />
                <input className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Unit" value={form.unitOfMeasure} onChange={(e) => update('unitOfMeasure', e.target.value)} />
                <input type="number" className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Lead time days" value={form.leadTimeDays} onChange={(e) => update('leadTimeDays', e.target.value)} />
                <input type="number" className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Cost price" value={form.costPrice} onChange={(e) => update('costPrice', e.target.value)} />
                <input type="number" className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Selling price" value={form.sellingPrice} onChange={(e) => update('sellingPrice', e.target.value)} />
                <input type="number" className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Reorder level" value={form.reorderLevel} onChange={(e) => update('reorderLevel', e.target.value)} />
                <input type="number" className="h-11 rounded-2xl border border-input/60 bg-background px-3 text-sm" placeholder="Max stock" value={form.maxStockLevel} onChange={(e) => update('maxStockLevel', e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</Button>
                {editingId && <Button type="button" variant="ghost" onClick={reset}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-transparent bg-card/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Catalogue</CardTitle>
              <div className="relative">
                <Search01Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="h-10 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm sm:w-72" placeholder="Search name, SKU, barcode..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Loading products...</p> : (
              <div className="space-y-2">
                {filtered.map((product) => (
                  <div key={product.productId} className="flex flex-col gap-3 rounded-2xl bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku} · {product.category} · {product.brand || 'No brand'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Reorder {product.reorderLevel} · Max {product.maxStockLevel} · Lead {product.leadTimeDays}d</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{product.currentQuantity ?? 0} {product.unitOfMeasure}</span>
                      <button className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => edit(product)} title="Edit">
                        <Edit02Icon className="h-4 w-4" />
                      </button>
                      <button className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={() => void remove(product)} title="Delete">
                        <Delete02Icon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
