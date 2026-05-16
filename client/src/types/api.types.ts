/**
 * ─── API Response Types ─────────────────────────────────────────────────────
 * Mirrors the backend's unified ApiResponse<T> wrapper.
 * Every endpoint returns this shape — always read `data` for the payload.
 */

/** Standard success/error envelope from the backend */
export interface ApiResponse<T> {
  token: any;
  status: number;
  message: string;
  data: T;
  timestamp: string;
  path?: string;
}

/** Shape of backend error responses (no data field) */
export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
  path?: string;
}
