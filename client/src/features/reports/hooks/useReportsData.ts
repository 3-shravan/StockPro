import { useState, useEffect, useCallback } from "react";
import { productsApi } from "@/features/products/api";
import { movementsApi } from "@/features/movements/api/movements.api";
import { reportsApi } from "@/features/reports/api/reports.api";
import { warehousesApi } from "@/features/warehouses/api";
import { suppliersApi } from "@/features/suppliers/api";
import { purchasesApi } from "@/features/purchases/api";
import { showToast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth.store";
import type { InventorySnapshot, POSummary } from "@/features/reports/types";
import { type Product, type Warehouse, type StockMovement, type Supplier, type PurchaseOrder, Role } from "@/types";

export const useReportsData = (filterWarehouseId?: number | null) => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<InventorySnapshot[]>([]);
  const [valuationDetails, setValuationDetails] = useState<InventorySnapshot[]>([]);
  const [poSummary, setPoSummary] = useState<POSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  
  const { user } = useAuthStore();

  const load = useCallback(async (period = selectedPeriod, isManual = false) => {
    if (!user) return;
    setLoading(true);
    const days = period === '7D' ? 7 : period === '90D' ? 90 : period === '1Y' ? 365 : 30;
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      if (isManual) await reportsApi.sync();

      // ─── Phase 1: Fetch baseline data ──────────────────────────────────────
      const [val, low, valDet, poSum, prods, whs, sups, movs, ords] = await Promise.all([
        reportsApi.getTotalValue(),
        reportsApi.getLowStockReport(),
        reportsApi.getValuationDetails(),
        reportsApi.getPOSummary(start, end),
        productsApi.getAll(),
        warehousesApi.getAll(),
        suppliersApi.getAll(),
        movementsApi.getAll(),
        purchasesApi.getAll()
      ]);

      // ─── Phase 2: Determine operational scope ──────────────────────────────
      let activeWarehouseId: number | null = filterWarehouseId ?? null;
      
      if (!filterWarehouseId) {
        if (user.role === Role.MANAGER) {
          activeWarehouseId = whs.find(w => w.managerId === user.userId)?.warehouseId ?? null;
        } else if (user.role === Role.STAFF) {
          activeWarehouseId = whs.find(w => w.name === user.department)?.warehouseId ?? null;
        }
      }

      // ─── Phase 3: Apply Scoping & Active-only Filtering ───────────────────
      // We keep inactive entities in 'warehouses'/'products' lists for historical reference
      // but we filter them for current operational metrics like 'Low Stock'.

      if (activeWarehouseId) {
        // Hub-Specific View
        const hubValuation = await reportsApi.getWarehouseValue(activeWarehouseId).catch(() => 0);
        setTotalValue(hubValuation);
        
        // Only show low stock for active products in this hub
        const activeProductIds = new Set(prods.filter(p => p.active).map(p => p.productId));
        setLowStock(low.filter(l => l.warehouseId === activeWarehouseId && activeProductIds.has(l.productId)));
        setValuationDetails(valDet.filter(v => v.warehouseId === activeWarehouseId));

        if (poSum && poSum.orders) {
          const hubOrders = poSum.orders.filter(o => o.warehouseId === activeWarehouseId);
          setPoSummary({
            totalOrders: hubOrders.length,
            totalAmount: hubOrders.reduce((acc, o) => acc + o.totalAmount, 0),
            orders: hubOrders,
            pendingApproval: hubOrders.filter(o => o.status === 'PENDING_APPROVAL').length,
            completed: hubOrders.filter(o => o.status === 'FULLY_RECEIVED').length,
            cancelled: hubOrders.filter(o => o.status === 'CANCELLED').length,
          });
        }

        setWarehouses(whs.filter(w => w.warehouseId === activeWarehouseId));
        setMovements(movs.filter(m => m.warehouseId === activeWarehouseId));
        setOrders(ords.filter(o => o.warehouseId === activeWarehouseId));
      } else {
        // Global View
        setTotalValue(val);
        // Filter low stock to only show active products
        const activeProductIds = new Set(prods.filter(p => p.active).map(p => p.productId));
        setLowStock(low.filter(l => activeProductIds.has(l.productId)));
        setValuationDetails(valDet);
        setPoSummary(poSum);
        setWarehouses(whs);
        setMovements(movs);
        setOrders(ords);
      }

      setProducts(prods);
      setSuppliers(sups);

    } catch (e) {
      console.error("Report sync error:", e);
      showToast.error("Analytics sync failed.");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, user, filterWarehouseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const changePeriod = (period: string) => {
    setSelectedPeriod(period);
    void load(period);
  };

  return {
    loading,
    selectedPeriod,
    totalValue,
    lowStock,
    valuationDetails,
    poSummary,
    products,
    warehouses,
    suppliers,
    movements,
    orders,
    refresh: () => load(selectedPeriod, true),
    changePeriod
  };
};
