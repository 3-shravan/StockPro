import { useEffect, useState } from 'react';
import { productsApi } from '@/features/products/api';
import type { Product } from '@/features/products/types';
import { Search01Icon } from 'hugeicons-react';

interface ProductSelectProps {
  value: number;
  onChange: (productId: number, product?: Product) => void;
  className?: string;
  placeholder?: string;
}

export const ProductSelect = ({ value, onChange, className = '', placeholder = 'Select product...' }: ProductSelectProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setProducts(await productsApi.getAll());
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

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
        {products.map((p) => (
          <option key={p.productId} value={p.productId}>
            {p.name} ({p.sku}) - Stock: {p.currentQuantity}
          </option>
        ))}
      </select>
    </div>
  );
};
