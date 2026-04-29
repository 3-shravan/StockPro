/**
 * ─── API Client (Axios) ─────────────────────────────────────────────────────
 * Centralized HTTP client for all backend communication.
 *
 * Responsibilities:
 *  1. Injects JWT token from Zustand auth store into every request.
 *  2. Handles global error responses (401, 403, 500, network errors).
 *  3. Fires Sonner toasts for user-facing errors.
 *  4. Triggers automatic logout on 401 (session expired).
 *
 * NOTE: This module must NOT import React hooks. It accesses Zustand stores
 * directly via `store.getState()` (vanilla access pattern).
 */
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

// ── Instance ────────────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000, // 15 seconds max
});

// ── Request Interceptor: Attach JWT ─────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Global Error Handling ─────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network failure (server unreachable, no internet)
    if (error.code === 'ERR_NETWORK' || !error.response) {
      toast.error('Network error — please check your connection.');
      return Promise.reject(error);
    }

    const { status } = error.response;
    const message: string =
      error.response.data?.message || 'Something went wrong';

    switch (status) {
      case 401:
        // Avoid double-toast on login page failures
        if (!window.location.pathname.includes('/login')) {
          toast.error('Session expired. Please log in again.');
          useAuthStore.getState().logout();
        }
        break;

      case 403:
        toast.error('Access denied — insufficient permissions.');
        break;

      case 409:
        toast.error(`Conflict: ${message}`);
        break;

      case 500:
        toast.error('Internal server error — please try again later.');
        break;

      // 400 and 404 are intentionally NOT toasted here.
      // They are handled at the feature/hook level so the caller
      // can provide context-aware messages (e.g., "Product not found").
    }

    return Promise.reject(error);
  },
);

export default apiClient;
