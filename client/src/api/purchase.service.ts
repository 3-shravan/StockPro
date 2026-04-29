import apiClient from '@/lib/api-client';
import { type PurchaseOrder, type ApiResponse, PurchaseOrderStatus } from '@/types';

export const purchaseService = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<PurchaseOrder[]>>('/purchase-orders');
    return response.data.data;
  },
  
  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return response.data.data;
  },
  
  getByStatus: async (status: PurchaseOrderStatus) => {
    const response = await apiClient.get<ApiResponse<PurchaseOrder[]>>(`/purchase-orders/status/${status}`);
    return response.data.data;
  },
  
  create: async (order: any) => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', order);
    return response.data.data;
  },
  
  approve: async (id: number) => {
    const response = await apiClient.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve`);
    return response.data.data;
  },
  
  receive: async (id: number, items: any) => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/receive`, { items });
    return response.data.data;
  }
};
