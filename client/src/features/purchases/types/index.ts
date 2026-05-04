import { PurchaseOrderStatus } from '@/types/enums';

export interface PurchaseOrder {
  poId: number;
  supplierId: number;
  supplierName?: string;
  warehouseId: number;
  warehouseName?: string;
  createdById: number;
  status: PurchaseOrderStatus;
  totalAmount: number;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  referenceNumber?: string;
  lineItems: POLineItem[];
}

export interface POLineItem {
  lineItemId: number;
  productId: number;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
}

export interface PurchaseOrderRequest {
  supplierId: number;
  warehouseId: number;
  expectedDate?: string;
  notes?: string;
  referenceNumber?: string;
  lineItems: POLineItemRequest[];
}

export interface POLineItemRequest {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface ReceiveGoodsRequest {
  items: Array<{ productId: number; quantity: number }>;
}
