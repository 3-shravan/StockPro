import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { Supplier, SupplierRequest } from '../types';

export const suppliersApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers');
    return data.data;
  },
  create: async (payload: SupplierRequest) => {
    const { data } = await apiClient.post<ApiResponse<Supplier>>('/suppliers', payload);
    return data.data;
  },
};
