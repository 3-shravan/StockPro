import apiClient from '@/lib/api-client';
import type { Warehouse } from '@/types';

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export const warehouseService = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses');
    return response.data.data;
  },
  
  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return response.data.data;
  },
  
  create: async (warehouse: Partial<Warehouse>) => {
    const response = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', warehouse);
    return response.data.data;
  },
  
  update: async (id: number, warehouse: Partial<Warehouse>) => {
    const response = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, warehouse);
    return response.data.data;
  },
  
  deactivate: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/warehouses/${id}`);
    return response.data.data;
  }
};
