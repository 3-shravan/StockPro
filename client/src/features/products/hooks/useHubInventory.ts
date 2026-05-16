/**
 * useHubInventory
 * ─────────────────────────────────────────────────────────────────────────────
 * For MANAGER and STAFF roles only. Fetches the user's assigned hub (warehouse),
 * then fetches all StockLevel records for that hub, then cross-references with
 * the global product catalog to produce a merged list of "HubProduct" objects
 * where `hubQty` reflects the WAREHOUSE-SPECIFIC quantity — not the global total.
 *
 * This fixes the root bug where ProductsPage showed `product.currentQuantity`
 * (sum of all warehouses) to Managers who should only see their own hub's stock.
 */

import { useState, useEffect, useCallback } from 'react';
import { warehousesApi } from '@/features/warehouses/api';
import { productsApi } from '@/features/products/api';
import { showToast } from '@/lib/toast';
import type { Warehouse, StockLevel } from '@/features/warehouses/types';

export interface HubProduct {
  // Product master data
  productId: number;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays: number;
  imageUrl?: string;
  barcode?: string;
  active: boolean;
  // Hub-specific stock data
  hubQty: number;           // quantity in THIS warehouse (not global)
  reservedQty: number;
  availableQty: number;
  isLowStock: boolean;      // based on hubQty vs reorderLevel
  stockId: number | null;
}

interface UseHubInventoryResult {
  loading: boolean;
  warehouse: Warehouse | null;
  warehouses: Warehouse[];
  products: HubProduct[];
  setSelectedWarehouse: (w: Warehouse) => void;
  refresh: () => void;
}

export const useHubInventory = (): UseHubInventoryResult => {
  const [loading, setLoading] = useState(true);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<HubProduct[]>([]);

  const loadProducts = useCallback(async (targetWarehouses: Warehouse[]) => {
    setLoading(true);
    try {
      const allProducts = await productsApi.getAll();
      const isAggregated = targetWarehouses.length > 1;

      // Fetch stock levels for ALL target warehouses in parallel
      const stockLevelPromises = targetWarehouses.map(w => 
        warehousesApi.getAllStockByWarehouse(w.warehouseId, true).catch(() => [] as StockLevel[])
      );
      const stockLevelResults = await Promise.all(stockLevelPromises);
      const allStockLevels = stockLevelResults.flat();

      // Create an aggregated stock map
      const stockMap = new Map<number, { quantity: number; reserved: number; available: number; stockId: number | null }>();
      
      allStockLevels.forEach(s => {
        const existing = stockMap.get(s.productId) || { quantity: 0, reserved: 0, available: 0, stockId: null };
        stockMap.set(s.productId, {
          quantity: existing.quantity + s.quantity,
          reserved: existing.reserved + (s.reservedQuantity ?? 0),
          available: existing.available + (s.availableQuantity ?? 0),
          stockId: isAggregated ? null : (existing.stockId || s.stockId), // stockId is only meaningful for single warehouse
        });
      });

      const merged: HubProduct[] = allProducts.map(product => {
        const stock = stockMap.get(product.productId);
        const hubQty = stock?.quantity ?? 0;
        return {
          productId: product.productId,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          brand: product.brand,
          unitOfMeasure: product.unitOfMeasure,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          reorderLevel: product.reorderLevel,
          maxStockLevel: product.maxStockLevel,
          leadTimeDays: product.leadTimeDays,
          imageUrl: product.imageUrl,
          barcode: product.barcode,
          active: product.active,
          hubQty: hubQty,
          reservedQty: stock?.reserved ?? 0,
          availableQty: stock?.available ?? 0,
          isLowStock: hubQty <= product.reorderLevel,
          stockId: stock?.stockId ?? null,
        };
      });

      setProducts(merged);
    } catch (err) {
      showToast.error('Unable to load hub inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const all = await warehousesApi.getAll();
      setWarehouses(all);
      
      if (all.length > 0) {
        // Default to the first warehouse instead of aggregation, as requested.
        setWarehouse(all[0]);
        await loadProducts([all[0]]);
      } else {
        setProducts([]);
        setLoading(false);
      }
    } catch (err) {
      showToast.error('Unable to initialize hub data.');
      setLoading(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    void init();
  }, [init]);

  return { 
    loading, 
    warehouse, 
    warehouses, 
    products, 
    setSelectedWarehouse: (w) => {
      setWarehouse(w);
      void loadProducts([w]);
    },
    refresh: () => {
      if (warehouse) {
        void loadProducts([warehouse]);
      } else if (warehouses.length > 0) {
        void loadProducts(warehouses);
      }
    }
  };
};
