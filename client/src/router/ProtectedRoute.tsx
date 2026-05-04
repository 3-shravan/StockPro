/**
 * ─── Protected Route Guard ──────────────────────────────────────────────────
 * Wraps routes that require authentication and/or specific roles.
 *
 * Usage in router:
 *   <Route element={<ProtectedRoute />}>             → any authenticated user
 *   <Route element={<ProtectedRoute roles={[Role.ADMIN]} />}>  → ADMIN only
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import type { Role } from '@/types';

interface Props {
  /** If provided, only users with one of these roles can access */
  roles?: Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute = ({ roles, children }: Props) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Not logged in → redirect to login, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → show 403 page
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks pass → render children or outlet
  return children ? <>{children}</> : <Outlet />;
};
