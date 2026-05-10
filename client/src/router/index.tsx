import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { UnauthorizedPage } from '@/features/auth/pages/UnauthorizedPage';
import { Role } from '@/types';

import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ProductsPage } from '@/features/products/pages/ProductsPage';
import { WarehousesPage } from '@/features/warehouses/pages/WarehousesPage';
import { WarehouseDetailPage } from '@/features/warehouses/pages/WarehouseDetailPage';
import { PurchaseOrdersPage } from '@/features/purchases/pages/PurchaseOrdersPage';
import { SuppliersPage } from '@/features/suppliers/pages/SuppliersPage';
import { MovementsPage } from '@/features/movements/pages/MovementsPage';
import { ReceivePage } from '@/features/movements/pages/ReceivePage';
import { IssuePage } from '@/features/movements/pages/IssuePage';
import { TransferPage } from '@/features/movements/pages/TransferPage';
import { AlertsPage } from '@/features/alerts/pages/AlertsPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';

const DashboardHome = ({ role }: { role: Role }) => <DashboardPage role={role} />;

export const defaultPathByRole: Record<Role, string> = {
  [Role.ADMIN]: '/admin',
  [Role.MANAGER]: '/manager',
  [Role.STAFF]: '/warehouse',
  [Role.OFFICER]: '/purchase',
};

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    <Route element={<DashboardLayout />}>
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <DashboardHome role={Role.ADMIN} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/warehouses"
        element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <WarehousesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/warehouses/:id"
        element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <WarehouseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <AlertsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={[Role.MANAGER]}>
            <DashboardHome role={Role.MANAGER} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/products"
        element={
          <ProtectedRoute roles={[Role.MANAGER, Role.ADMIN, Role.STAFF]}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <ProtectedRoute roles={[Role.MANAGER, Role.ADMIN]}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/stock"
        element={
          <ProtectedRoute roles={[Role.MANAGER, Role.ADMIN]}>
            <WarehousesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/stock/:id"
        element={
          <ProtectedRoute roles={[Role.MANAGER, Role.ADMIN]}>
            <WarehouseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/purchase-orders"
        element={
          <ProtectedRoute roles={[Role.MANAGER, Role.ADMIN]}>
            <PurchaseOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/movements"
        element={
          <ProtectedRoute roles={[Role.MANAGER, Role.ADMIN, Role.STAFF]}>
            <MovementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/alerts"
        element={
          <ProtectedRoute roles={[Role.MANAGER]}>
            <AlertsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warehouse"
        element={
          <ProtectedRoute roles={[Role.STAFF, Role.ADMIN]}>
            <DashboardHome role={Role.STAFF} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/stock/:id"
        element={
          <ProtectedRoute roles={[Role.STAFF, Role.ADMIN]}>
            <WarehouseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/products"
        element={
          <ProtectedRoute roles={[Role.STAFF, Role.ADMIN]}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/receive"
        element={
          <ProtectedRoute roles={[Role.STAFF, Role.ADMIN]}>
            <ReceivePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/issue"
        element={
          <ProtectedRoute roles={[Role.STAFF, Role.ADMIN]}>
            <IssuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/transfer"
        element={
          <ProtectedRoute roles={[Role.STAFF, Role.ADMIN]}>
            <TransferPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/movements"
        element={
          <ProtectedRoute roles={[Role.STAFF, Role.ADMIN]}>
            <MovementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouse/alerts"
        element={
          <ProtectedRoute roles={[Role.STAFF, Role.ADMIN]}>
            <AlertsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase"
        element={
          <ProtectedRoute roles={[Role.OFFICER, Role.ADMIN, Role.MANAGER]}>
            <DashboardHome role={Role.OFFICER} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase/orders"
        element={
          <ProtectedRoute roles={[Role.OFFICER, Role.ADMIN, Role.MANAGER]}>
            <PurchaseOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase/suppliers"
        element={
          <ProtectedRoute roles={[Role.OFFICER, Role.ADMIN, Role.MANAGER]}>
            <SuppliersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase/alerts"
        element={
          <ProtectedRoute roles={[Role.OFFICER, Role.ADMIN, Role.MANAGER]}>
            <AlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={[Role.ADMIN, Role.MANAGER, Role.STAFF, Role.OFFICER]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Route>

    <Route path="/dashboard" element={<Navigate to="/login" replace />} />
    <Route path="/products" element={<Navigate to="/login" replace />} />
    <Route path="/warehouses" element={<Navigate to="/login" replace />} />
    <Route path="/purchase-orders" element={<Navigate to="/login" replace />} />
    <Route path="/suppliers" element={<Navigate to="/login" replace />} />
    <Route path="/movements" element={<Navigate to="/login" replace />} />
    <Route path="/reports" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);
