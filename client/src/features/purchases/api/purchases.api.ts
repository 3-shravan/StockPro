/**
 * ─── Purchase Orders API ────────────────────────────────────────────────────
 * All HTTP calls for the Purchase Service (PO lifecycle).
 */
import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  PurchaseOrder,
  PurchaseOrderRequest,
  ReceiveGoodsRequest,
} from '@/types';

export const purchasesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>('/purchase-orders');
    return data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return data;
  },

  getBySupplier: async (supplierId: number) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>(
      `/purchase-orders/supplier/${supplierId}`,
    );
    return data;
  },

  getByWarehouse: async (warehouseId: number) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>(
      `/purchase-orders/warehouse/${warehouseId}`,
    );
    return data;
  },

  getByStatus: async (status: string) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>(
      `/purchase-orders/status/${status}`,
    );
    return data;
  },

  getByDateRange: async (start: string, end: string) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>(
      '/purchase-orders/date-range',
      { params: { start, end } },
    );
    return data;
  },

  create: async (payload: PurchaseOrderRequest) => {
    const { data } = await apiClient.post<ApiResponse<PurchaseOrder>>(
      '/purchase-orders',
      payload,
    );
    return data;
  },

  update: async (id: number, payload: PurchaseOrderRequest) => {
    const { data } = await apiClient.put<ApiResponse<PurchaseOrder>>(
      `/purchase-orders/${id}`,
      payload,
    );
    return data;
  },

  /** PUT /purchase-orders/:id/approve → move PO to APPROVED status */
  approve: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/purchase-orders/${id}/approve`);
    return data;
  },

  /** POST /purchase-orders/:id/receive → receive goods (auto-updates stock) */
  receiveGoods: async (id: number, payload: ReceiveGoodsRequest) => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      `/purchase-orders/${id}/receive`,
      payload,
    );
    return data;
  },

  /** PUT /purchase-orders/:id/cancel → cancel PO */
  cancel: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/purchase-orders/${id}/cancel`);
    return data;
  },
};
