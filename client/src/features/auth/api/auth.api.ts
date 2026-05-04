/**
 * ─── Auth API ───────────────────────────────────────────────────────────────
 * All HTTP calls for the Auth Service (registration, login, users, profiles).
 * Each method returns `ApiResponse<T>.data` — the unwrapped payload.
 */
import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  User,
  AuthTokenResponse,
  LoginRequest,
  RegisterRequest,
} from '@/types';

export const authApi = {
  // ── Public Endpoints ────────────────────────────────────────────────────

  /** POST /auth/login → returns JWT token */
  login: async (credentials: LoginRequest) => {
    const { data } = await apiClient.post<ApiResponse<AuthTokenResponse>>(
      '/auth/login',
      credentials,
    );
    return data.data;
  },

  /** POST /auth/register → returns created User */
  register: async (payload: RegisterRequest) => {
    const { data } = await apiClient.post<ApiResponse<User>>(
      '/auth/register',
      payload,
    );
    return data.data;
  },

  // ── Authenticated Endpoints ─────────────────────────────────────────────

  /** POST /auth/logout → invalidates server-side session */
  logout: async () => {
    const { data } = await apiClient.post<ApiResponse<void>>('/auth/logout');
    return data.data;
  },

  /** POST /auth/refresh → returns a new JWT token */
  refresh: async () => {
    const { data } = await apiClient.post<ApiResponse<AuthTokenResponse>>(
      '/auth/refresh',
    );
    return data.data;
  },

  /** GET /auth/profile/:userId → returns User profile */
  getProfile: async (userId: number) => {
    const { data } = await apiClient.get<ApiResponse<User>>(
      `/auth/profile/${userId}`,
    );
    return data.data;
  },

  /** GET /auth/me → returns current User profile from token */
  getMe: async (token?: string) => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return data.data;
  },

  /** PUT /auth/profile/:userId → updates and returns User profile */
  updateProfile: async (userId: number, payload: Partial<User>) => {
    const { data } = await apiClient.put<ApiResponse<User>>(
      `/auth/profile/${userId}`,
      payload,
    );
    return data.data;
  },

  /** PUT /auth/password/:userId → changes user password */
  changePassword: async (userId: number, newPassword: string) => {
    const { data } = await apiClient.put<ApiResponse<void>>(
      `/auth/password/${userId}`,
      { newPassword },
    );
    return data.data;
  },

  // ── Admin Endpoints ─────────────────────────────────────────────────────

  /** GET /auth/users → returns all users (ADMIN/MANAGER) */
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<User[]>>('/auth/users');
    return data.data;
  },

  /** PUT /auth/deactivate/:userId → soft-deletes a user (ADMIN) */
  deactivate: async (userId: number) => {
    const { data } = await apiClient.put<ApiResponse<void>>(
      `/auth/deactivate/${userId}`,
    );
    return data.data;
  },
};
