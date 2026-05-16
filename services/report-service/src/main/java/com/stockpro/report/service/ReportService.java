package com.stockpro.report.service;

import com.stockpro.report.entity.InventorySnapshot;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ReportService {
    InventorySnapshot takeSnapshot(int warehouseId, int productId);
    Double getTotalStockValue();
    Double getStockValueByWarehouse(int warehouseId);
    Double getInventoryTurnover(int productId, LocalDate start, LocalDate end);
    List<InventorySnapshot> getLowStockReport();
    Map<String, Integer> getStockMovementSummary(int warehouseId);
    List<Integer> getTopMovingProducts(int limit);
    List<Integer> getSlowMovingProducts(int limit);
    Map<String, Object> getPOSummary(LocalDate start, LocalDate end);
    List<InventorySnapshot> getValuationDetails();
    List<InventorySnapshot> getValuationDetailsByWarehouse(int warehouseId);
    void runSync();
    List<Integer> getDeadStock();
}
