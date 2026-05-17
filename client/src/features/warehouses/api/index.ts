import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type {
  StockLevel,
  StockReservationRequest,
  StockTransferRequest,
  StockUpdateRequest,
  Warehouse,
  WarehouseRequest,
  WarehouseStats,
} from '../types';

export const warehousesApi = {
  getAll: async (includeInactive = false): Promise<Warehouse[]> => {
    const res = await apiClient.get<ApiResponse<Warehouse[]>>(`/warehouses?includeInactive=${includeInactive}`);
    return res.data.data;
  },
  getById: async (id: number): Promise<Warehouse> => {
    const res = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return res.data.data;
  },
  getAllStockByWarehouse: async (warehouseId: number, silent = false): Promise<StockLevel[]> => {
    const res = await apiClient.get<ApiResponse<StockLevel[]>>(`/warehouses/${warehouseId}/stock`, {
      silent
    } as any);
    return res.data.data;
  },
  create: async (payload: WarehouseRequest): Promise<Warehouse> => {
    const res = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', payload);
    return res.data.data;
  },
  update: async (id: number, payload: WarehouseRequest): Promise<Warehouse> => {
    const res = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, payload);
    return res.data.data;
  },
  deactivate: async (id: number): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/warehouses/${id}`);
    return res.data.data;
  },
  activate: async (id: number): Promise<void> => {
    const res = await apiClient.post<ApiResponse<void>>(`/warehouses/${id}/activate`);
    return res.data.data;
  },
  hardDelete: async (id: number): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/warehouses/${id}/hard`);
    return res.data.data;
  },
  getStock: async (warehouseId: number, productId: number, silent = false): Promise<StockLevel> => {
    const res = await apiClient.get<ApiResponse<StockLevel>>(
      `/warehouses/${warehouseId}/stock/${productId}`,
      { silent } as any
    );
    return res.data.data;
  },
  updateStock: async (payload: StockUpdateRequest): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>('/warehouses/stock/update', payload);
    return res.data.data;
  },
  adjustStock: async (payload: StockUpdateRequest): Promise<void> => {
    const res = await apiClient.put<ApiResponse<void>>('/warehouses/stock/adjust', payload);
    return res.data.data;
  },
  reserveStock: async (payload: StockReservationRequest): Promise<void> => {
    const res = await apiClient.post<ApiResponse<void>>('/warehouses/stock/reserve', payload);
    return res.data.data;
  },
  transferStock: async (payload: StockTransferRequest): Promise<void> => {
    const res = await apiClient.post<ApiResponse<void>>('/warehouses/stock/transfer', payload);
    return res.data.data;
  },
  getLowStock: async (warehouseId: number): Promise<StockLevel[]> => {
    const res = await apiClient.get<ApiResponse<StockLevel[]>>(
      `/warehouses/${warehouseId}/stock/low`,
    );
    return res.data.data;
  },
  getStockByProduct: async (productId: number): Promise<StockLevel[]> => {
    const res = await apiClient.get<ApiResponse<StockLevel[]>>(
      `/warehouses/stock/product/${productId}`,
    );
    return res.data.data;
  },
  getStats: async (id: number): Promise<WarehouseStats> => {
    const res = await apiClient.get<ApiResponse<WarehouseStats>>(`/warehouses/${id}/stats`);
    return res.data.data;
  },
  reconcile: async (id: number): Promise<void> => {
    const res = await apiClient.post<ApiResponse<void>>(`/warehouses/${id}/reconcile`);
    return res.data.data;
  },
};
