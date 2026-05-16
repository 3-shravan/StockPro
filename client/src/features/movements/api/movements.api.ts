/**
 * ─── Movements API ──────────────────────────────────────────────────────────
 * All HTTP calls for the Movement Service (audit logs / stock history).
 * Most movements are system-generated; the frontend primarily reads them.
 */
import apiClient from '@/lib/api-client';
import type { ApiResponse, StockMovement, StockMovementRequest } from '@/types';

export const movementsApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<StockMovement[]>>('/movements');
    return data.data;
  },

  getByProduct: async (productId: number) => {
    const { data } = await apiClient.get<ApiResponse<StockMovement[]>>(
      `/movements/product/${productId}`,
    );
    return data.data;
  },

  getByWarehouse: async (warehouseId: number) => {
    const { data } = await apiClient.get<ApiResponse<StockMovement[]>>(
      `/movements/warehouse/${warehouseId}`,
    );
    return data.data;
  },

  getByType: async (movementType: string) => {
    const { data } = await apiClient.get<ApiResponse<StockMovement[]>>(
      `/movements/type/${movementType}`,
    );
    return data.data;
  },

  getByDateRange: async (start: string, end: string) => {
    const { data } = await apiClient.get<ApiResponse<StockMovement[]>>(
      '/movements/date-range',
      { params: { start, end } },
    );
    return data.data;
  },

  getByReference: async (referenceId: number) => {
    const { data } = await apiClient.get<ApiResponse<StockMovement[]>>(
      `/movements/reference/${referenceId}`,
    );
    return data.data;
  },

  /** GET /movements/history/:productId/:warehouseId → full history */
  getHistory: async (productId: number, warehouseId: number) => {
    const { data } = await apiClient.get<ApiResponse<StockMovement[]>>(
      `/movements/history/${productId}/${warehouseId}`,
    );
    return data.data;
  },

  /** GET /movements/stock-in/:productId → total units received */
  getTotalStockIn: async (productId: number) => {
    const { data } = await apiClient.get<ApiResponse<number>>(
      `/movements/stock-in/${productId}`,
    );
    return data.data;
  },

  /** GET /movements/stock-out/:productId → total units dispatched */
  getTotalStockOut: async (productId: number) => {
    const { data } = await apiClient.get<ApiResponse<number>>(
      `/movements/stock-out/${productId}`,
    );
    return data.data;
  },

  /** POST /movements → create manual movement entry */
  create: async (payload: StockMovementRequest) => {
    const { data } = await apiClient.post<ApiResponse<StockMovement>>('/movements', payload);
    return data.data;
  },
};
