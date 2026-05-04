import { useEffect, useState } from 'react';
import { suppliersApi } from '@/features/suppliers/api';
import type { Supplier } from '@/types';
import { UserGroupIcon } from 'hugeicons-react';

interface SupplierSelectProps {
  value: number;
  onChange: (supplierId: number, supplier?: Supplier) => void;
  className?: string;
  placeholder?: string;
}

export const SupplierSelect = ({ value, onChange, className = '', placeholder = 'Select supplier...' }: SupplierSelectProps) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setSuppliers(await suppliersApi.getAll());
      } catch (error) {
        console.error('Failed to load suppliers', error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <UserGroupIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => {
          const id = Number(e.target.value);
          const supplier = suppliers.find(s => s.supplierId === id);
          onChange(id, supplier);
        }}
        className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm focus:border-primary outline-none appearance-none"
      >
        <option value={0}>{loading ? 'Loading...' : placeholder}</option>
        {suppliers.map((s) => (
          <option key={s.supplierId} value={s.supplierId}>
            {s.name} ({s.city})
          </option>
        ))}
      </select>
    </div>
  );
};
