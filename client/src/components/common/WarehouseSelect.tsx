import { useEffect, useState } from 'react';
import { warehousesApi } from '@/features/warehouses/api';
import type { Warehouse } from '@/types';
import { Building05Icon } from 'hugeicons-react';
import { useAuthStore } from '@/stores/auth.store';
import { Role } from '@/types/enums';
import { cn } from '@/lib/utils';

interface WarehouseSelectProps {
  value: number;
  onChange: (warehouseId: number, warehouse?: Warehouse) => void;
  className?: string;
  placeholder?: string;
  restrictToAssigned?: boolean;
}

export const WarehouseSelect = ({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Select warehouse...',
  restrictToAssigned = false
}: WarehouseSelectProps) => {
  const { user } = useAuthStore();
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

  const filteredWarehouses = warehouses.filter(w => {
    if (restrictToAssigned && user?.role === Role.STAFF) {
      return w.name === user.department;
    }
    return true;
  });

  return (
    <div className={cn("relative", className)}>
      <Building05Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => {
          const id = Number(e.target.value);
          const warehouse = warehouses.find(w => w.warehouseId === id);
          onChange(id, warehouse);
        }}
        className={cn(
          "w-full rounded-2xl pl-9 pr-3 text-sm focus:border-primary outline-none appearance-none transition-all",
          className.includes('!h-') ? '' : 'h-11',
          className.includes('!border-none') ? 'border-none' : 'border border-input/60',
          className.includes('!bg-transparent') ? 'bg-transparent' : 'bg-background',
          className
        )}
      >
        <option value={0}>{loading ? 'Loading...' : placeholder}</option>
        {filteredWarehouses.map((w) => (
          <option key={w.warehouseId} value={w.warehouseId} className="bg-card text-foreground">
            {w.name} ({w.location})
          </option>
        ))}
      </select>
    </div>
  );
};
