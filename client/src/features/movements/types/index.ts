import { MovementType } from '@/types/enums';

export interface StockMovement {
  movementId: number;
  productId: number;
  warehouseId: number;
  movementType: MovementType;
  quantity: number;
  referenceId: number;
  referenceType: string;
  unitCost: number;
  performedBy: number;
  notes?: string;
  movementDate: string;
  balanceAfter: number;
}

export interface StockMovementRequest {
  productId: number;
  warehouseId: number;
  movementType: string;
  quantity: number;
  referenceId: number;
  referenceType: string;
  unitCost: number;
  performedBy: number;
  notes?: string;
  balanceAfter: number;
}
