import { useQuery } from '@tanstack/react-query';
import { purchasesApi } from '../api';
import type { PurchaseOrderStatus } from '@/types/enums';

export const purchaseKeys = {
  all: ['purchase-orders'] as const,
  byStatus: (status: PurchaseOrderStatus) => ['purchase-orders', status] as const,
};

export const usePurchaseOrders = (status?: PurchaseOrderStatus) => {
  return useQuery({
    queryKey: status ? purchaseKeys.byStatus(status) : purchaseKeys.all,
    queryFn: () => status ? purchasesApi.getByStatus(status) : purchasesApi.getAll(),
  });
};
