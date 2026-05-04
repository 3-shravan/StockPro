import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { Product, ProductRequest } from '../types';

export const productsApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products');
    return data.data;
  },
  getLowStock: async () => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products/low-stock');
    return data.data;
  },
  create: async (payload: ProductRequest) => {
    const { data } = await apiClient.post<ApiResponse<Product>>('/products', payload);
    return data.data;
  },
};
