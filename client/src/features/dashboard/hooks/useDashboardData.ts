import { useState, useEffect, useCallback } from "react";
import { productsApi } from "@/features/products/api";
import { warehousesApi } from "@/features/warehouses/api";
import { alertsApi } from "@/features/alerts/api/alerts.api";
import { purchasesApi } from "@/features/purchases/api";
import { reportsApi } from "@/features/reports/api/reports.api";
import { suppliersApi } from "@/features/suppliers/api";
import { movementsApi } from "@/features/movements/api/movements.api";
import { showToast } from "@/lib/toast";
import { type Product, type Warehouse, type Alert, type PurchaseOrder, type Supplier, type StockMovement } from "@/types";
import { PurchaseOrderStatus } from "@/types/enums";

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [metrics, setMetrics] = useState({ criticalAlerts: 0, pendingApprovals: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [val, prods, whs, alts, pos, sups, movs] = await Promise.all([
        reportsApi.getTotalValue(),
        productsApi.getAll(),
        warehousesApi.getAll(),
        alertsApi.getAll(),
        purchasesApi.getAll(),
        suppliersApi.getAll(),
        movementsApi.getAll(),
      ]);

      setTotalValue(val);
      setProducts(prods);
      setWarehouses(whs);
      setAlerts(alts);
      setOrders(pos);
      setSuppliers(sups);
      setMovements(movs);

      setMetrics({
        criticalAlerts: alts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.acknowledged).length,
        pendingApprovals: pos.filter((o: PurchaseOrder) => o.status === PurchaseOrderStatus.PENDING_APPROVAL).length,
      });
    } catch (e) {
      showToast.error("Failed to sync dashboard protocols.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    refresh: loadData
  };
};
