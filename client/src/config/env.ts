/**
 * ─── Environment Configuration ────────────────────────────────────────────────
 * Centralized place to access and validate environment variables.
 */
export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

