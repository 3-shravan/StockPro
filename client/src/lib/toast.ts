/**
 * ─── Toast Utility ──────────────────────────────────────────────────────────
 * Thin abstraction over Sonner toast for consistent usage across features.
 * Provides typed helpers so components don't import `sonner` directly.
 */
import { toast } from 'sonner';

export const showToast = {
  /** Green checkmark toast — use after successful create/update/delete */
  success: (message: string) => toast.success(message),

  /** Red X toast — use for validation errors, business rule violations */
  error: (message: string) => toast.error(message),

  /** Yellow exclamation toast — use for warnings (e.g., low stock) */
  warning: (message: string) => toast.warning(message),

  /** Blue info toast — use for neutral information */
  info: (message: string) => toast.info(message),

  /** Loading toast with auto-dismiss — returns a dismiss function */
  loading: (message: string) => toast.loading(message),

  /** Promise-based toast — shows loading → success/error automatically */
  promise: <T>(
    promise: Promise<T>,
    opts: { loading: string; success: string; error: string },
  ) => toast.promise(promise, opts),

  /** Manually dismiss a specific toast by ID */
  dismiss: (id?: string | number) => toast.dismiss(id),
};
