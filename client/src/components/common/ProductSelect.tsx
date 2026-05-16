import { useEffect, useState } from 'react';
import { productsApi } from '@/features/products/api';
import { warehousesApi } from '@/features/warehouses/api';
import type { Product } from '@/features/products/types';
import { Search01Icon } from 'hugeicons-react';

interface ProductSelectProps {
  value: number;
  onChange: (productId: number, product?: Product) => void;
  warehouseId?: number;
  className?: string;
  placeholder?: string;
}

export const ProductSelect = ({ 
  value, 
  onChange, 
  warehouseId,
  className = '', 
  placeholder = 'Select product...' 
}: ProductSelectProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const allProducts = await productsApi.getAll();
        setProducts(allProducts);

        if (warehouseId) {
          const stats = await warehousesApi.getStats(warehouseId);
          const stockMap: Record<number, number> = {};
          stats.topProducts.forEach(p => {
            stockMap[p.productId] = p.quantity;
          });
          // Note: stats might only have top products. 
          // For a full list, we might need a different endpoint or just show what we have.
          // Better: just fetch the stock for each product or have an endpoint for all stock in a warehouse.
          setWarehouseStock(stockMap);
        }
      } catch (error) {
        console.error('Failed to load products/stock', error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [warehouseId]);

  return (
    <div className={`relative ${className}`}>
      <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => {
          const id = Number(e.target.value);
          const product = products.find(p => p.productId === id);
          onChange(id, product);
        }}
        className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm focus:border-primary outline-none appearance-none"
      >
        <option value={0}>{loading ? 'Loading...' : placeholder}</option>
        {products.map((p) => {
          const stock = warehouseId ? (warehouseStock[p.productId] || 0) : p.currentQuantity;
          return (
            <option key={p.productId} value={p.productId}>
              {p.name} ({p.sku}) - Stock: {stock}
            </option>
          );
        })}
      </select>
    </div>
  );
};
