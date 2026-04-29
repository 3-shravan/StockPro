import { movementService } from '@/api/movement.service';
import { productService } from '@/api/product.service';
import { purchaseService } from '@/api/purchase.service';
import { warehouseService } from '@/api/warehouse.service';
import { PurchaseOrderStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ── Warehouse Hooks ────────────────────────────────────────────────────────
export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getAll,
  });
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: warehouseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse created successfully');
    },
  });
};

// ── Product Hooks ──────────────────────────────────────────────────────────
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: productService.getAll,
  });
};

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: productService.getLowStock,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
  });
};

// ── Purchase Order Hooks ───────────────────────────────────────────────────
export const usePurchaseOrders = (status?: PurchaseOrderStatus) => {
  return useQuery({
    queryKey: ['purchase-orders', status],
    queryFn: () => status ? purchaseService.getByStatus(status) : purchaseService.getAll(),
  });
};

// ── Movement Hooks ─────────────────────────────────────────────────────────
export const useMovements = () => {
  return useQuery({
    queryKey: ['movements'],
    queryFn: movementService.getAll,
  });
};
