/**
 * ─── Alerts API ─────────────────────────────────────────────────────────────
 * All HTTP calls for the Alert Service (notifications).
 */
import apiClient from '@/lib/api-client';
import type { ApiResponse, Alert, AlertRequest } from '@/types';

export const alertsApi = {
  /** GET /alerts/recipient/:userId → alerts for a specific user */
  getByUser: async (userId: number) => {
    const { data } = await apiClient.get<ApiResponse<Alert[]>>(`/alerts/recipient/${userId}`);
    return data.data;
  },

  /** GET /alerts/recipient/:userId/unread-count → integer count */
  getUnreadCount: async (userId: number) => {
    const { data } = await apiClient.get<ApiResponse<number>>(
      `/alerts/recipient/${userId}/unread-count`,
    );
    return data.data;
  },

  /** PUT /alerts/:alertId/read → mark single alert as read */
  markAsRead: async (alertId: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/alerts/${alertId}/read`);
    return data.data;
  },

  /** PUT /alerts/recipient/:userId/read-all → mark all alerts as read */
  markAllAsRead: async (userId: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(
      `/alerts/recipient/${userId}/read-all`,
    );
    return data.data;
  },

  /** PUT /alerts/:alertId/acknowledge → acknowledge alert */
  acknowledge: async (alertId: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(`/alerts/${alertId}/acknowledge`);
    return data.data;
  },

  /** GET /alerts/unacknowledged → all unacknowledged alerts (MANAGER/ADMIN) */
  getUnacknowledged: async () => {
    const { data } = await apiClient.get<ApiResponse<Alert[]>>('/alerts/unacknowledged');
    return data.data;
  },

  /** GET /alerts → all alerts (ADMIN only) */
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Alert[]>>('/alerts');
    return data;
  },

  /** POST /alerts → send a new alert (MANAGER/ADMIN) */
  send: async (payload: AlertRequest) => {
    const { data } = await apiClient.post<ApiResponse<Alert>>('/alerts', payload);
    return data;
  },

  /** DELETE /alerts/:alertId → delete alert (ADMIN) */
  delete: async (alertId: number) => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/alerts/${alertId}`);
    return data;
  },
};
