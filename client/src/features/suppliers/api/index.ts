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
  search: async (query: string) => {
    const { data } = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers/search', {
      params: { q: query },
    });
    return data.data;
  },
  update: async (id: number, payload: SupplierRequest) => {
    const { data } = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, payload);
    return data.data;
  },
  deactivate: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/suppliers/${id}/deactivate`);
    return data.data;
  },
  updateRating: async (id: number, rating: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/suppliers/${id}/rating`, null, {
      params: { rating },
    });
    return data.data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/suppliers/${id}`);
    return data.data;
  },
};
