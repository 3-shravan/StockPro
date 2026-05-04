import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import type { PurchaseOrderStatus } from '@/types/enums';
import type { PurchaseOrder } from '../types';

export const purchasesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>('/purchase-orders');
    return data.data;
  },
  getByStatus: async (status: PurchaseOrderStatus) => {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder[]>>(`/purchase-orders/status/${status}`);
    return data.data;
  },
};
