/**
 * ─── Reports Feature Types ──────────────────────────────────────────────────
 */

export interface InventorySnapshot {
  snapshotId: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  stockValue: number;
  snapshotDate: string;
  createdAt: string;
  productName?: string;
}

export interface POSummary {
  totalOrders: number;
  totalAmount: number;
  pendingApproval?: number;
  completed?: number;
  cancelled?: number;
  orders?: any[];
}
