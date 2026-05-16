import { create } from 'zustand';
import { alertsApi } from '@/features/alerts/api/alerts.api';
import type { Alert } from '@/types';
import { showToast } from '@/lib/toast';

interface AlertsState {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  isPanelOpen: boolean;
  
  fetchAlerts: (userId: number, role: string, warehouseId?: number) => Promise<void>;
  fetchUnreadCount: (userId: number, role: string, warehouseId?: number) => Promise<void>;
  markAsRead: (alertId: number) => Promise<void>;
  markAllAsRead: (userId: number) => Promise<void>;
  acknowledge: (alertId: number, userId: number) => Promise<void>;
  setIsPanelOpen: (isOpen: boolean) => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  unreadCount: 0,
  loading: false,
  isPanelOpen: false,

  setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),

  fetchAlerts: async (userId, role, warehouseId) => {
    set({ loading: true });
    try {
      const data = await alertsApi.getByContext(userId, role, warehouseId);
      set({ alerts: data, unreadCount: data.filter(a => !a.read).length });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async (userId, role, warehouseId) => {
    try {
      const count = await alertsApi.getUnreadCountByContext(userId, role, warehouseId);
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (alertId) => {
    try {
      await alertsApi.markAsRead(alertId);
      set(state => ({
        alerts: state.alerts.map(a => a.alertId === alertId ? { ...a, read: true } : a),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      showToast.error("Failed to update alert status");
    }
  },

  markAllAsRead: async (userId) => {
    try {
      await alertsApi.markAllAsRead(userId);
      set(state => ({
        alerts: state.alerts.map(a => ({ ...a, read: true })),
        unreadCount: 0
      }));
      showToast.success("All cleared");
    } catch (error) {
      showToast.error("Batch update failed");
    }
  },

  acknowledge: async (alertId, userId) => {
    try {
      await alertsApi.acknowledge(alertId, userId);
      set(state => ({
        alerts: state.alerts.map(a => a.alertId === alertId ? { ...a, acknowledged: true } : a)
      }));
      showToast.success("System protocol acknowledged");
    } catch (error) {
      showToast.error("Authorization failed");
    }
  }
}));
