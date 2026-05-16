/**
 * ─── Enum Constants ─────────────────────────────────────────────────────────
 * Client-side mirrors of the backend Java enums.
 * Using `as const` objects + type aliases for TypeScript erasableSyntaxOnly
 * compatibility (no runtime enum code emitted).
 */

// ── User Roles ──────────────────────────────────────────────────────────────
export const Role = {
  STAFF: 'STAFF',
  MANAGER: 'MANAGER',
  OFFICER: 'OFFICER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// ── Purchase Order Lifecycle ────────────────────────────────────────────────
export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED: 'FULLY_RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;
export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

// ── Stock Movement Types ────────────────────────────────────────────────────
export const MovementType = {
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  WRITE_OFF: 'WRITE_OFF',
  RETURN: 'RETURN',
} as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

// ── Alert Types ─────────────────────────────────────────────────────────────
export const AlertType = {
  LOW_STOCK: 'LOW_STOCK',
  OVERSTOCK: 'OVERSTOCK',
  PO_PENDING: 'PO_PENDING',
  OVERDUE_RECEIPT: 'OVERDUE_RECEIPT',
  SYSTEM: 'SYSTEM',
} as const;
export type AlertType = (typeof AlertType)[keyof typeof AlertType];

// ── Alert Severity ──────────────────────────────────────────────────────────
export const AlertSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

// ── Alert Channel ───────────────────────────────────────────────────────────
export const AlertChannel = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  BOTH: 'BOTH',
} as const;
export type AlertChannel = (typeof AlertChannel)[keyof typeof AlertChannel];
