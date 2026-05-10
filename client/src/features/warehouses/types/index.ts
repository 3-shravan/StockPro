export interface Warehouse {
  warehouseId: number;
  name: string;
  location: string;
  address: string;
  managerId: number;
  capacity: number;
  usedCapacity: number;
  active: boolean;
  phone?: string;
  createdAt: string;
}

export interface WarehouseRequest {
  name: string;
  location: string;
  address: string;
  managerId: number;
  capacity: number;
  phone?: string;
}

export interface StockLevel {
  stockId: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  location?: string;
  lastUpdated: string;
}

export interface StockUpdateRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
}

export interface StockReservationRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
}

export interface StockTransferRequest {
  fromWarehouseId: number;
  toWarehouseId: number;
  productId: number;
  quantity: number;
  managerId: number;
}

export interface ProductStockStat {
  productId: number;
  productName: string;
  quantity: number;
}

export interface WarehouseStats {
  warehouseId: number;
  warehouseName: string;
  totalItems: number;
  uniqueProducts: number;
  capacity: number;
  usedCapacity: number;
  utilizedPercentage: number;
  lowStockItems: number;
  topProducts: ProductStockStat[];
}
