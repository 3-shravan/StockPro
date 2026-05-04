/**
 * ─── Reports API ───────────────────────────────────────────────────────────
 * All HTTP calls for the Report Service.
 */
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { InventorySnapshot, POSummary } from '../types';

export const reportsApi = {
  /** GET /reports/total-value → get total stock value */
  getTotalValue: async () => {
    const { data } = await apiClient.get<ApiResponse<number>>('/reports/total-value');
    return data;
  },

  /** GET /reports/value/warehouse/:id → stock value for specific warehouse */
  getWarehouseValue: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<number>>(`/reports/value/warehouse/${id}`);
    return data;
  },

  /** GET /reports/turnover/:productId → turnover ratio for product */
  getTurnover: async (productId: number, start: string, end: string) => {
    const { data } = await apiClient.get<ApiResponse<number>>(`/reports/turnover/${productId}`, {
      params: { start, end },
    });
    return data;
  },

  /** GET /reports/low-stock → current low stock report */
  getLowStockReport: async () => {
    const { data } = await apiClient.get<ApiResponse<InventorySnapshot[]>>('/reports/low-stock');
    return data;
  },

  /** GET /reports/top-moving → IDs of top moving products */
  getTopMoving: async (limit = 10) => {
    const { data } = await apiClient.get<ApiResponse<number[]>>('/reports/top-moving', {
      params: { limit },
    });
    return data;
  },

  /** GET /reports/slow-moving → IDs of slow moving products */
  getSlowMoving: async (limit = 10) => {
    const { data } = await apiClient.get<ApiResponse<number[]>>('/reports/slow-moving', {
      params: { limit },
    });
    return data;
  },

  /** GET /reports/dead-stock → IDs of products with no movement */
  getDeadStock: async () => {
    const { data } = await apiClient.get<ApiResponse<number[]>>('/reports/dead-stock');
    return data;
  },

  /** GET /reports/po-summary → Purchase Order analytics */
  getPOSummary: async (start: string, end: string) => {
    const { data } = await apiClient.get<ApiResponse<POSummary>>('/reports/po-summary', {
      params: { start, end },
    });
    return data;
  },

  /** POST /reports/snapshot/:warehouseId → manual snapshot (Admin) */
  takeSnapshot: async (warehouseId: number, productId: number) => {
    const { data } = await apiClient.post<ApiResponse<InventorySnapshot>>(
      `/reports/snapshot/${warehouseId}`,
      null,
      { params: { productId } }
    );
    return data;
  },
};
