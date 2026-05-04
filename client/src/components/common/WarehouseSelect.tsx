import { useEffect, useState } from 'react';
import { warehousesApi } from '@/features/warehouses/api';
import type { Warehouse } from '@/types';
import { WarehouseIcon } from 'hugeicons-react';

interface WarehouseSelectProps {
  value: number;
  onChange: (warehouseId: number, warehouse?: Warehouse) => void;
  className?: string;
  placeholder?: string;
}

export const WarehouseSelect = ({ value, onChange, className = '', placeholder = 'Select warehouse...' }: WarehouseSelectProps) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setWarehouses(await warehousesApi.getAll());
      } catch (error) {
        console.error('Failed to load warehouses', error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <WarehouseIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => {
          const id = Number(e.target.value);
          const warehouse = warehouses.find(w => w.warehouseId === id);
          onChange(id, warehouse);
        }}
        className="h-11 w-full rounded-2xl border border-input/60 bg-background pl-9 pr-3 text-sm focus:border-primary outline-none appearance-none"
      >
        <option value={0}>{loading ? 'Loading...' : placeholder}</option>
        {warehouses.map((w) => (
          <option key={w.warehouseId} value={w.warehouseId}>
            {w.name} ({w.location})
          </option>
        ))}
      </select>
    </div>
  );
};
