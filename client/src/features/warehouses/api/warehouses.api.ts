/**
 * ─── Warehouses API ─────────────────────────────────────────────────────────
 * All HTTP calls for the Warehouse Service (warehouses + stock operations).
 */
import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  Warehouse,
  WarehouseRequest,
  StockLevel,
  StockUpdateRequest,
  StockReservationRequest,
  StockTransferRequest,
} from '@/types';

export const warehousesApi = {
  // ── Warehouse CRUD ────────────────────────────────────────────────────────

  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses');
    return data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return data;
  },

  create: async (payload: WarehouseRequest) => {
    const { data } = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', payload);
    return data;
  },

  update: async (id: number, payload: Partial<WarehouseRequest>) => {
    const { data } = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, payload);
    return data;
  },

  deactivate: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/warehouses/${id}`);
    return data;
  },

  // ── Stock Operations ──────────────────────────────────────────────────────

  /** GET /warehouses/:wId/stock/:pId → stock level for a product in a warehouse */
  getStockLevel: async (warehouseId: number, productId: number) => {
    const { data } = await apiClient.get<ApiResponse<StockLevel>>(
      `/warehouses/${warehouseId}/stock/${productId}`,
    );
    return data;
  },

  /** GET /warehouses/:wId/stock/low → low-stock items in a warehouse */
  getLowStockItems: async (warehouseId: number) => {
    const { data } = await apiClient.get<ApiResponse<StockLevel[]>>(
      `/warehouses/${warehouseId}/stock/low`,
    );
    return data;
  },

  /** PUT /warehouses/stock/update → set absolute stock value */
  updateStock: async (payload: StockUpdateRequest) => {
    const { data } = await apiClient.put<ApiResponse<void>>('/warehouses/stock/update', payload);
    return data;
  },

  /** PUT /warehouses/stock/adjust → add/subtract from current stock */
  adjustStock: async (payload: StockUpdateRequest) => {
    const { data } = await apiClient.put<ApiResponse<void>>('/warehouses/stock/adjust', payload);
    return data;
  },

  /** POST /warehouses/stock/reserve → reserve stock for an order */
  reserveStock: async (payload: StockReservationRequest) => {
    const { data } = await apiClient.post<ApiResponse<void>>('/warehouses/stock/reserve', payload);
    return data;
  },

  /** POST /warehouses/stock/transfer → move stock between warehouses */
  transferStock: async (payload: StockTransferRequest) => {
    const { data } = await apiClient.post<ApiResponse<void>>('/warehouses/stock/transfer', payload);
    return data;
  },
};
