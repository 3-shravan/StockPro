import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { Product, ProductRequest } from '../types';

export const productsApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products');
    return data.data;
  },
  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },
  getLowStock: async () => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products/low-stock');
    return data.data;
  },
  search: async (query: string) => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products/search', {
      params: { query },
    });
    return data.data;
  },
  create: async (payload: ProductRequest) => {
    const { data } = await apiClient.post<ApiResponse<Product>>('/products', payload);
    return data.data;
  },
  update: async (id: number, payload: ProductRequest) => {
    const { data } = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return data.data;
  },
  deactivate: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/products/${id}/deactivate`);
    return data.data;
  },
  delete: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
    return data.data;
  },
};
