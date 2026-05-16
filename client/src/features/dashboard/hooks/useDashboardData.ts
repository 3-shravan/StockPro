import { useState, useEffect, useCallback } from "react";
import { warehousesApi } from "@/features/warehouses/api";
import { alertsApi } from "@/features/alerts/api/alerts.api";
import { purchasesApi } from "@/features/purchases/api";
import { suppliersApi } from "@/features/suppliers/api";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";
import { type Warehouse, type Alert, type PurchaseOrder, type Supplier, Role } from "@/types";
import { PurchaseOrderStatus } from "@/types/enums";

export interface DashboardData {
  loading: boolean;
  warehouses: Warehouse[];
  alerts: Alert[];
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  metrics: { criticalAlerts: number; pendingApprovals: number };
  managedWarehouses: Warehouse[];
  refresh: () => void;
}

export const useDashboardData = (): DashboardData => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [metrics, setMetrics] = useState({ criticalAlerts: 0, pendingApprovals: 0 });
  const [managedWarehouses, setManagedWarehouses] = useState<Warehouse[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // ─── ADMIN: Full global data, no restrictions ─────────────────────────
      if (user.role === Role.ADMIN) {
        const [whs, alts, pos, sups] = await Promise.all([
          warehousesApi.getAll().catch(() => []),
          alertsApi.getAll().catch(() => []),
          purchasesApi.getAll().catch(() => []),
          suppliersApi.getAll().catch(() => []),
        ]);
        setWarehouses(whs);
        setAlerts(alts);
        setOrders(pos);
        setSuppliers(sups);
        setManagedWarehouses([]);
        
        setMetrics({
          criticalAlerts: alts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.acknowledged).length,
          pendingApprovals: pos.filter((o: PurchaseOrder) => o.status === PurchaseOrderStatus.PENDING_APPROVAL).length,
        });
        return;
      }

      // ─── OFFICER: Global procurement + suppliers, no warehouse-specific data ──
      if (user.role === Role.OFFICER) {
        const [pos, sups, alts] = await Promise.all([
          purchasesApi.getAll().catch(() => []),
          suppliersApi.getAll().catch(() => []),
          alertsApi.getByUser(user.userId).catch(() => []),
        ]);
        setOrders(pos);
        setSuppliers(sups);
        setAlerts(alts);
        setWarehouses([]);
        setManagedWarehouses([]);
        setMetrics({
          criticalAlerts: alts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.acknowledged).length,
          pendingApprovals: pos.filter((o: PurchaseOrder) => o.status === PurchaseOrderStatus.PENDING_APPROVAL).length,
        });
        return;
      }

      // ─── MANAGER & STAFF: Resolve hub warehouses ───────────────────────────
      const allWarehouses = await warehousesApi.getAll().catch(() => []);
      let hubWarehouses: Warehouse[] = [];

      if (user.role === Role.MANAGER) {
        // Manager can only manage ONE hub now
        const managerHub = allWarehouses.find((w) => w.managerId === user.userId && w.active);
        hubWarehouses = managerHub ? [managerHub] : [];
      } else if (user.role === Role.STAFF) {
        // Staff are linked to a single warehouse by department matching name
        const staffHub = allWarehouses.find((w) => w.name === user.department && w.active);
        hubWarehouses = staffHub ? [staffHub] : [];
      }

      setManagedWarehouses(hubWarehouses);

      // ─── MANAGER: Single Hub-scoped data ──────────────────────────────
      if (user.role === Role.MANAGER) {
        const [alts, pos] = await Promise.all([
          alertsApi.getAll().catch(() => []),
          purchasesApi.getAll().catch(() => []),
        ]);

        setWarehouses(hubWarehouses);
        setAlerts(alts);
        setOrders(pos);
        setSuppliers([]);

        setMetrics({
          criticalAlerts: alts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.acknowledged).length,
          pendingApprovals: pos.filter((o: PurchaseOrder) => o.status === PurchaseOrderStatus.PENDING_APPROVAL).length,
        });
        return;
      }

      // ─── STAFF: Hub-scoped deliveries + personal alerts only ──────────────
      if (user.role === Role.STAFF) {
        const [alts, pos] = await Promise.all([
          alertsApi.getAll().catch(() => []),
          purchasesApi.getAll().catch(() => []),
        ]);

        setAlerts(alts);
        setOrders(pos);
        setWarehouses(hubWarehouses);
        setSuppliers([]);
        setManagedWarehouses(hubWarehouses);

        setMetrics({
          criticalAlerts: alts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.acknowledged).length,
          pendingApprovals: 0,
        });
      }

    } catch (e) {
      console.error("Dashboard sync error:", e);
      showToast.error("Partial failure in dashboard protocols.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    loading,
    warehouses,
    alerts,
    orders,
    suppliers,
    metrics,
    managedWarehouses,
    refresh: loadData,
  };
};
