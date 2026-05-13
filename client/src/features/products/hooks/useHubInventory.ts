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
  products: HubProduct[];
  refresh: () => void;
}

export const useHubInventory = (): UseHubInventoryResult => {
  const [loading, setLoading] = useState(true);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [products, setProducts] = useState<HubProduct[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Get the user's scoped warehouse (backend already filters by department)
      const warehouses = await warehousesApi.getAll();
      const myWarehouse = warehouses[0] ?? null; // Manager/Staff always have exactly one
      setWarehouse(myWarehouse);

      if (!myWarehouse) {
        // No warehouse assigned — show empty inventory
        setProducts([]);
        return;
      }

      // Step 2: Fetch all stock levels for this warehouse + full product catalog in parallel
      let stockLevels: StockLevel[] = [];
      const allProducts = await productsApi.getAll();

      try {
        // Try the bulk endpoint first (newly added, might not be deployed yet)
        // Pass 'true' for silent to suppress 500 error toast if not deployed
        stockLevels = await warehousesApi.getAllStockByWarehouse(myWarehouse.warehouseId, true);
      } catch (err) {
        console.warn('Bulk stock endpoint not available, falling back to individual calls...');
        // Fallback: Fetch stock for each product individually (works with existing backend)
        const individualCalls = allProducts.map(p => 
          warehousesApi.getStock(myWarehouse.warehouseId, p.productId, true)
            .catch(() => null) // Ignore products not in this warehouse
        );
        const results = await Promise.all(individualCalls);
        stockLevels = results.filter((s): s is StockLevel => s !== null);
      }

      // Step 3: Build a map of productId → StockLevel for fast lookup
      const stockMap = new Map<number, StockLevel>(
        stockLevels.map((s) => [s.productId, s])
      );

      // Step 4: Merge — Include ALL products from the catalog
      // This ensures Managers can see global products even if they have 0 stock in their hub
      const merged: HubProduct[] = allProducts.map(product => {
        const stock = stockMap.get(product.productId);
        
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
          // Hub-specific stock — default to 0 if no record exists
          hubQty: stock?.quantity ?? 0,
          reservedQty: stock?.reservedQuantity ?? 0,
          availableQty: stock?.availableQuantity ?? 0,
          isLowStock: (stock?.quantity ?? 0) <= product.reorderLevel,
          stockId: stock?.stockId ?? null,
        };
      });

      setProducts(merged);
    } catch (err: any) {
      showToast.error('Unable to load hub inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, warehouse, products, refresh: load };
};
