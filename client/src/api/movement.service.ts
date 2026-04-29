import apiClient from '@/lib/api-client';
import type { ApiResponse, StockMovement } from '@/types';

export const movementService = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<StockMovement[]>>('/movements');
    return response.data.data;
  },
  
  getByProduct: async (productId: number) => {
    const response = await apiClient.get<ApiResponse<StockMovement[]>>(`/movements/product/${productId}`);
    return response.data.data;
  },
  
  getByWarehouse: async (warehouseId: number) => {
    const response = await apiClient.get<ApiResponse<StockMovement[]>>(`/movements/warehouse/${warehouseId}`);
    return response.data.data;
  },
  
  getHistory: async (productId: number, warehouseId: number) => {
    const response = await apiClient.get<ApiResponse<StockMovement[]>>(`/movements/history/${productId}/${warehouseId}`);
    return response.data.data;
  }
};
