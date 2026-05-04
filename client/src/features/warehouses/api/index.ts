import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { Warehouse, WarehouseRequest } from '../types';

export const warehousesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses');
    return data.data;
  },
  create: async (payload: WarehouseRequest) => {
    const { data } = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', payload);
    return data.data;
  },
};
