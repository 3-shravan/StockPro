import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { suppliersApi } from '../api';
import type { SupplierRequest } from '../types';

export const supplierKeys = {
  all: ['suppliers'] as const,
};

export const useSuppliers = () => {
  return useQuery({
    queryKey: supplierKeys.all,
    queryFn: () => suppliersApi.getAll(),
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupplierRequest) => suppliersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      toast.success('Supplier created successfully');
    },
  });
};
