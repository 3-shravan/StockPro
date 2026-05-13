import { useState, useEffect, useCallback } from "react";
import { productsApi } from "@/features/products/api";
import { warehousesApi } from "@/features/warehouses/api";
import { alertsApi } from "@/features/alerts/api/alerts.api";
import { purchasesApi } from "@/features/purchases/api";
import { reportsApi } from "@/features/reports/api/reports.api";
import { suppliersApi } from "@/features/suppliers/api";
import { movementsApi } from "@/features/movements/api/movements.api";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";
import { type Product, type Warehouse, type Alert, type PurchaseOrder, type Supplier, type StockMovement, Role } from "@/types";
import { PurchaseOrderStatus } from "@/types/enums";

export interface DashboardData {
  loading: boolean;
  totalValue: number;
  products: Product[];
  warehouses: Warehouse[];
  alerts: Alert[];
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  movements: StockMovement[];
  metrics: { criticalAlerts: number; pendingApprovals: number };
  managedWarehouse: Warehouse | null;
  refresh: () => void;
}

export const useDashboardData = (): DashboardData => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [metrics, setMetrics] = useState({ criticalAlerts: 0, pendingApprovals: 0 });
  const [managedWarehouse, setManagedWarehouse] = useState<Warehouse | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // ─── ADMIN: Full global data, no restrictions ─────────────────────────
      if (user.role === Role.ADMIN) {
        const [val, prods, whs, alts, pos, sups, movs] = await Promise.all([
          reportsApi.getTotalValue().catch(() => 0),
          productsApi.getAll().catch(() => []),
          warehousesApi.getAll().catch(() => []),
          alertsApi.getAll().catch(() => []),
          purchasesApi.getAll().catch(() => []),
          suppliersApi.getAll().catch(() => []),
          movementsApi.getAll().catch(() => []),
        ]);
        setTotalValue(val);
        setProducts(prods);
        setWarehouses(whs);
        setAlerts(alts);
        setOrders(pos);
        setSuppliers(sups);
        setMovements(movs);
        setManagedWarehouse(null);
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
        setTotalValue(0);
        setProducts([]);
        setWarehouses([]);
        setMovements([]);
        setManagedWarehouse(null);
        setMetrics({
          criticalAlerts: alts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.acknowledged).length,
          pendingApprovals: pos.filter((o: PurchaseOrder) => o.status === PurchaseOrderStatus.PENDING_APPROVAL).length,
        });
        return;
      }

      // ─── MANAGER & STAFF: Resolve hub warehouse first ──────────────────────
      const allWarehouses = await warehousesApi.getAll().catch(() => []);

      let hubWarehouse: Warehouse | null = null;

      if (user.role === Role.MANAGER) {
        // Manager is explicitly linked to a warehouse via managerId
        hubWarehouse = allWarehouses.find((w) => w.managerId === user.userId) ?? null;
      } else if (user.role === Role.STAFF) {
        // Staff are linked to a warehouse by their department name matching warehouse name
        hubWarehouse = allWarehouses.find((w) => w.name === user.department) ?? null;
      }

      setManagedWarehouse(hubWarehouse);

      // ─── MANAGER: Hub-scoped data ──────────────────────────────────────────
      if (user.role === Role.MANAGER) {
        const warehouseId = hubWarehouse?.warehouseId ?? null;

        const [val, prods, alts, pos, movs] = await Promise.all([
          // Hub-specific asset value
          warehouseId
            ? reportsApi.getWarehouseValue(warehouseId).catch(() => 0)
            : Promise.resolve(0),
          // All products (for low-stock detection filtered later by hub stock)
          productsApi.getAll().catch(() => []),
          // Only this manager's personal + hub alerts
          alertsApi.getByUser(user.userId).catch(() => []),
          // Only POs for this manager's warehouse
          warehouseId
            ? purchasesApi.getByWarehouse(warehouseId).catch(() => [])
            : Promise.resolve([]),
          // Hub-scoped movements
          movementsApi.getAll().catch(() => []),
        ]);

        // Filter movements to hub warehouse only
        const hubMovements = warehouseId
          ? movs.filter((m: StockMovement) => m.warehouseId === warehouseId)
          : [];


        setTotalValue(val);
        setProducts(prods);
        setWarehouses(hubWarehouse ? [hubWarehouse] : []);
        setAlerts(alts);
        setOrders(pos);
        setSuppliers([]);
        setMovements(hubMovements);
        setMetrics({
          criticalAlerts: alts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.acknowledged).length,
          pendingApprovals: pos.filter((o: PurchaseOrder) => o.status === PurchaseOrderStatus.PENDING_APPROVAL).length,
        });
        return;
      }

      // ─── STAFF: Hub-scoped deliveries + personal alerts only ──────────────
      if (user.role === Role.STAFF) {
        const warehouseId = hubWarehouse?.warehouseId ?? null;

        const [alts, pos, movs] = await Promise.all([
          // Only personal alerts
          alertsApi.getByUser(user.userId).catch(() => []),
          // Only POs destined for their hub (APPROVED ones they need to receive)
          warehouseId
            ? purchasesApi.getByWarehouse(warehouseId).catch(() => [])
            : Promise.resolve([]),
          // Hub-scoped movements only
          movementsApi.getAll().catch(() => []),
        ]);

        const hubMovements = warehouseId
          ? movs.filter((m: StockMovement) => m.warehouseId === warehouseId)
          : [];


        setAlerts(alts);
        setOrders(pos);
        setMovements(hubMovements);
        setTotalValue(0);
        setProducts([]);
        setWarehouses(hubWarehouse ? [hubWarehouse] : []);
        setSuppliers([]);
        setMetrics({
          criticalAlerts: alts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.acknowledged).length,
          pendingApprovals: 0, // Staff don't approve POs
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
    totalValue,
    products,
    warehouses,
    alerts,
    orders,
    suppliers,
    movements,
    metrics,
    managedWarehouse,
    refresh: loadData,
  };
};
