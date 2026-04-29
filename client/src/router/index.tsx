/**
 * ─── Application Router ─────────────────────────────────────────────────────
 * Defines all routes for the StockPro client.
 *
 * Route structure:
 *   /login            → Public (login page)
 *   /register         → Public (register page)
 *   /unauthorized     → Public (403 page)
 *   /                 → Protected → redirects to /dashboard
 *   /dashboard        → Protected (any authenticated user)
 *   /products         → Protected (any authenticated user)
 *   /warehouses       → Protected (any authenticated user)
 *   /purchase-orders  → Protected (OFFICER, MANAGER, ADMIN)
 *   /suppliers        → Protected (OFFICER, MANAGER, ADMIN)
 *   /movements        → Protected (MANAGER, ADMIN)
 *   /alerts           → Protected (any authenticated user)
 *   /users            → Protected (ADMIN, MANAGER)
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Role } from '@/types';

// ── Page Placeholders (replace with real pages when building UI) ─────────
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { UnauthorizedPage } from '@/features/auth/pages/UnauthorizedPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ProductsPage } from '@/features/products/pages/ProductsPage';
import { WarehousesPage } from '@/features/warehouses/pages/WarehousesPage';
import { PurchaseOrdersPage } from '@/features/purchases/pages/PurchaseOrdersPage';
import { SuppliersPage } from '@/features/suppliers/pages/SuppliersPage';
import { MovementsPage } from '@/features/movements/pages/MovementsPage';
import { AlertsPage } from '@/features/alerts/pages/AlertsPage';

export const router = createBrowserRouter([
  // ── Public Routes ───────────────────────────────────────────────────────
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // ── Protected Routes ────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Basic Access
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/products', element: <ProductsPage /> },
          { path: '/warehouses', element: <WarehousesPage /> },
          { path: '/alerts', element: <AlertsPage /> },

          // Restricted Access (OFFICER, MANAGER, ADMIN)
          { 
            path: '/purchase-orders', 
            element: <ProtectedRoute roles={[Role.OFFICER, Role.MANAGER, Role.ADMIN]}><PurchaseOrdersPage /></ProtectedRoute> 
          },
          { 
            path: '/suppliers', 
            element: <ProtectedRoute roles={[Role.OFFICER, Role.MANAGER, Role.ADMIN]}><SuppliersPage /></ProtectedRoute> 
          },

          // Management Access (MANAGER, ADMIN)
          { 
            path: '/movements', 
            element: <ProtectedRoute roles={[Role.MANAGER, Role.ADMIN]}><MovementsPage /></ProtectedRoute> 
          },
        ],
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
]);
