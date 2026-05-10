import { create } from 'zustand';
import { alertsApi } from '@/features/alerts/api/alerts.api';

interface AlertsState {
  unreadCount: number;
  loading: boolean;
  fetchUnreadCount: (userId: number) => Promise<void>;
  setUnreadCount: (count: number) => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  unreadCount: 0,
  loading: false,
  fetchUnreadCount: async (userId: number) => {
    set({ loading: true });
    try {
      const count = await alertsApi.getUnreadCount(userId);
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      set({ loading: false });
    }
  },
  setUnreadCount: (count: number) => set({ unreadCount: count }),
}));
