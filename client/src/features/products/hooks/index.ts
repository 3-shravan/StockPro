import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsApi } from '../api';
import type { ProductRequest } from '../types';

export const productKeys = {
  all: ['products'] as const,
  lowStock: ['products', 'low-stock'] as const,
};

export const useProducts = () => {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: productsApi.getAll,
  });
};

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: productKeys.lowStock,
    queryFn: productsApi.getLowStock,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductRequest) => productsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success('Product created successfully');
    },
  });
};
