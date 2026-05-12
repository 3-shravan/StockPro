import { useState, useEffect, useCallback } from "react";
import { productsApi } from "@/features/products/api";
import { movementsApi } from "@/features/movements/api/movements.api";
import { reportsApi } from "@/features/reports/api/reports.api";
import { warehousesApi } from "@/features/warehouses/api";
import { suppliersApi } from "@/features/suppliers/api";
import { purchasesApi } from "@/features/purchases/api";
import { showToast } from "@/lib/toast";
import type { InventorySnapshot, POSummary } from "@/features/reports/types";
import { type Product, type Warehouse, type StockMovement, type Supplier, type PurchaseOrder } from "@/types";

export const useReportsData = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<InventorySnapshot[]>([]);
  const [valuationDetails, setValuationDetails] = useState<InventorySnapshot[]>([]);
  const [topMoving, setTopMoving] = useState<number[]>([]);
  const [slowMoving, setSlowMoving] = useState<number[]>([]);
  const [deadStock, setDeadStock] = useState<number[]>([]);
  const [poSummary, setPoSummary] = useState<POSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  const load = useCallback(async (period = selectedPeriod, isManual = false) => {
    setLoading(true);
    const days = period === '7D' ? 7 : period === '90D' ? 90 : period === '1Y' ? 365 : 30;
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      if (isManual) await reportsApi.sync();

      const [val, low, valDet, top, slow, dead, poSum, prods, whs, sups, movs, ords] = await Promise.all([
        reportsApi.getTotalValue(),
        reportsApi.getLowStockReport(),
        reportsApi.getValuationDetails(),
        reportsApi.getTopMoving(10),
        reportsApi.getSlowMoving(10),
        reportsApi.getDeadStock(),
        reportsApi.getPOSummary(start, end),
        productsApi.getAll(),
        warehousesApi.getAll(),
        suppliersApi.getAll(),
        movementsApi.getAll(),
        purchasesApi.getAll()
      ]);

      setTotalValue(val);
      setLowStock(low);
      setValuationDetails(valDet);
      setTopMoving(top);
      setSlowMoving(slow);
      setDeadStock(dead);
      setPoSummary(poSum);
      setProducts(prods);
      setWarehouses(whs);
      setSuppliers(sups);
      setMovements(movs);
      setOrders(ords);
    } catch (e) {
      showToast.error("Analytics sync failed.");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

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
    topMoving,
    slowMoving,
    deadStock,
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
