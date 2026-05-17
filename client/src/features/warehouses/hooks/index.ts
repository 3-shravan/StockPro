import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { warehousesApi } from '../api';
import type { WarehouseRequest } from '../types';

export const warehouseKeys = {
  all: ['warehouses'] as const,
};

export const useWarehouses = () => {
  return useQuery({
    queryKey: warehouseKeys.all,
    queryFn: () => warehousesApi.getAll(),
  });
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WarehouseRequest) => warehousesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      toast.success('Warehouse created successfully');
    },
  });
};
