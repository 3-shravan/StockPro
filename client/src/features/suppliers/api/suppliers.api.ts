/**
 * ─── Suppliers API ──────────────────────────────────────────────────────────
 * All HTTP calls for the Supplier Service.
 */
import apiClient from '@/lib/api-client';
import type { ApiResponse, Supplier, SupplierRequest } from '@/types';

export const suppliersApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers');
    return data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return data;
  },

  search: async (query: string) => {
    const { data } = await apiClient.get<ApiResponse<Supplier[]>>('/suppliers/search', {
      params: { q: query },
    });
    return data;
  },

  getByCity: async (city: string) => {
    const { data } = await apiClient.get<ApiResponse<Supplier[]>>(`/suppliers/city/${city}`);
    return data;
  },

  getByCountry: async (country: string) => {
    const { data } = await apiClient.get<ApiResponse<Supplier[]>>(`/suppliers/country/${country}`);
    return data;
  },

  create: async (payload: SupplierRequest) => {
    const { data } = await apiClient.post<ApiResponse<Supplier>>('/suppliers', payload);
    return data;
  },

  update: async (id: number, payload: Partial<SupplierRequest>) => {
    const { data } = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, payload);
    return data;
  },

  updateRating: async (id: number, rating: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/suppliers/${id}/rating`, null, {
      params: { rating },
    });
    return data;
  },

  deactivate: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/suppliers/${id}/deactivate`);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/suppliers/${id}`);
    return data;
  },
};
