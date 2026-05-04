import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  StockLevel,
  StockReservationRequest,
  StockTransferRequest,
  StockUpdateRequest,
  Warehouse,
  WarehouseRequest,
} from '../types';

export const warehousesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses');
    return data.data;
  },
  create: async (payload: WarehouseRequest) => {
    const { data } = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', payload);
    return data.data;
  },
  update: async (id: number, payload: WarehouseRequest) => {
    const { data } = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, payload);
    return data.data;
  },
  deactivate: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/warehouses/${id}`);
    return data.data;
  },
  getStock: async (warehouseId: number, productId: number) => {
    const { data } = await apiClient.get<ApiResponse<StockLevel>>(
      `/warehouses/${warehouseId}/stock/${productId}`,
    );
    return data.data;
  },
  updateStock: async (payload: StockUpdateRequest) => {
    const { data } = await apiClient.put<ApiResponse<void>>('/warehouses/stock/update', payload);
    return data.data;
  },
  adjustStock: async (payload: StockUpdateRequest) => {
    const { data } = await apiClient.put<ApiResponse<void>>('/warehouses/stock/adjust', payload);
    return data.data;
  },
  reserveStock: async (payload: StockReservationRequest) => {
    const { data } = await apiClient.post<ApiResponse<void>>('/warehouses/stock/reserve', payload);
    return data.data;
  },
  transferStock: async (payload: StockTransferRequest) => {
    const { data } = await apiClient.post<ApiResponse<void>>('/warehouses/stock/transfer', payload);
    return data.data;
  },
  getLowStock: async (warehouseId: number) => {
    const { data } = await apiClient.get<ApiResponse<StockLevel[]>>(
      `/warehouses/${warehouseId}/stock/low`,
    );
    return data.data;
  },
};
