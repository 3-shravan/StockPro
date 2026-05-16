import { AlertType, AlertSeverity, AlertChannel } from '@/types/enums';

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
  acknowledgedBy?: number;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface AlertRequest {
  recipientId?: number;
  targetRole?: string;
  targetWarehouseId?: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  relatedProductId?: number;
  relatedWarehouseId?: number;
  channel: string;
}
