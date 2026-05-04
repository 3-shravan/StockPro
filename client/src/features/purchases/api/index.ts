import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { PurchaseOrderStatus } from '@/types/enums';
import type { PurchaseOrder, PurchaseOrderRequest, ReceiveGoodsRequest } from '../types';

export const purchasesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>('/purchase-orders');
    return data.data;
  },
  getByStatus: async (status: PurchaseOrderStatus) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>(`/purchase-orders/status/${status}`);
    return data.data;
  },
  create: async (payload: PurchaseOrderRequest) => {
    const { data } = await apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', payload);
    return data.data;
  },
  update: async (id: number, payload: PurchaseOrderRequest) => {
    const { data } = await apiClient.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, payload);
    return data.data;
  },
  approve: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/purchase-orders/${id}/approve`);
    return data.data;
  },
  cancel: async (id: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/purchase-orders/${id}/cancel`);
    return data.data;
  },
  receive: async (id: number, payload: ReceiveGoodsRequest) => {
    const { data } = await apiClient.post<ApiResponse<void>>(`/purchase-orders/${id}/receive`, payload);
    return data.data;
  },
  getBySupplier: async (supplierId: number) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>(
      `/purchase-orders/supplier/${supplierId}`,
    );
    return data.data;
  },
  getByWarehouse: async (warehouseId: number) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>(
      `/purchase-orders/warehouse/${warehouseId}`,
    );
    return data.data;
  },
};
