/**
 * ─── Domain Model Types ─────────────────────────────────────────────────────
 * TypeScript interfaces that mirror every backend DTO/entity response shape.
 * Organized by microservice domain.
 */
import type {
  Role,
  PurchaseOrderStatus,
  MovementType,
  AlertType,
  AlertSeverity,
  AlertChannel,
} from './enums';

// ═══════════════════════════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/** User entity returned by auth endpoints */
export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  department?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/** JWT token wrapper returned by login/refresh */
export interface AuthTokenResponse {
  token: string;
}

/** Payload for POST /auth/register */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  role?: Role;
}

/** Payload for POST /auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/** Product entity returned by product endpoints */
export interface Product {
  productId: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string;
  barcode?: string;
  currentQuantity: number;
  active: boolean;
}

/** Payload for POST/PUT /products */
export interface ProductRequest {
  sku?: string; // Required only on create
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string;
  barcode?: string;
  currentQuantity: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// WAREHOUSE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/** Warehouse entity */
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

/** Payload for POST/PUT /warehouses */
export interface WarehouseRequest {
  name: string;
  location: string;
  address: string;
  managerId: number;
  capacity: number;
  phone?: string;
}

/** Stock level for a product in a specific warehouse */
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

/** Payload for stock update/adjust */
export interface StockUpdateRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
}

/** Payload for stock reservation */
export interface StockReservationRequest {
  warehouseId: number;
  productId: number;
  quantity: number;
}

/** Payload for inter-warehouse stock transfer */
export interface StockTransferRequest {
  fromWarehouseId: number;
  toWarehouseId: number;
  productId: number;
  quantity: number;
  managerId: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PURCHASE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/** Purchase Order response (enriched with supplier/warehouse names) */
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

/** Line item within a Purchase Order */
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

/** Payload for creating a Purchase Order */
export interface PurchaseOrderRequest {
  supplierId: number;
  warehouseId: number;
  expectedDate?: string;
  notes?: string;
  referenceNumber?: string;
  lineItems: POLineItemRequest[];
}

/** Line item within a PO creation request */
export interface POLineItemRequest {
  productId: number;
  quantity: number;
  unitCost: number;
}

/** Payload for receiving goods against a PO */
export interface ReceiveGoodsRequest {
  items: Array<{ productId: number; quantity: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIER SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/** Supplier entity */
export interface Supplier {
  supplierId: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  leadTimeDays: number;
  rating: number;
  isActive: boolean;
}

/** Payload for POST/PUT /suppliers */
export interface SupplierRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  leadTimeDays: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOVEMENT SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/** Stock movement audit entry */
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

/** Payload for POST /movements */
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

// ═══════════════════════════════════════════════════════════════════════════
// ALERT SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/** Alert notification entity */
export interface Alert {
  alertId: number;
  recipientId: number;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedProductId?: number;
  relatedWarehouseId?: number;
  channel: AlertChannel;
  read: boolean;
  acknowledged: boolean;
  createdAt: string;
}

/** Payload for POST /alerts */
export interface AlertRequest {
  recipientId: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  relatedProductId?: number;
  relatedWarehouseId?: number;
  channel: string;
}
