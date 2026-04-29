import apiClient from '@/lib/api-client';
import type { Product, ApiResponse } from '@/types';

export const productService = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products');
    return response.data.data;
  },
  
  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },
  
  getBySku: async (sku: string) => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/sku/${sku}`);
    return response.data.data;
  },
  
  search: async (query: string) => {
    const response = await apiClient.get<ApiResponse<Product[]>>(`/products/search?query=${query}`);
    return response.data.data;
  },
  
  getLowStock: async () => {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products/low-stock');
    return response.data.data;
  },
  
  create: async (product: Partial<Product>) => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', product);
    return response.data.data;
  },
  
  update: async (id: number, product: Partial<Product>) => {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, product);
    return response.data.data;
  },
  
  delete: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
    return response.data.data;
  }
};
