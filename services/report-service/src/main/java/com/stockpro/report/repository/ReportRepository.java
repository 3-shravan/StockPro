package com.stockpro.report.repository;

import com.stockpro.report.entity.InventorySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<InventorySnapshot, Integer> {

    List<InventorySnapshot> findByWarehouseId(int warehouseId);

    List<InventorySnapshot> findByProductId(int productId);

    List<InventorySnapshot> findBySnapshotDate(LocalDate date);

    @Query("SELECT s FROM InventorySnapshot s WHERE s.snapshotDate BETWEEN :start AND :end")
    List<InventorySnapshot> findByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(s.stockValue) FROM InventorySnapshot s WHERE s.warehouseId = :warehouseId AND s.snapshotDate = (SELECT MAX(sub.snapshotDate) FROM InventorySnapshot sub)")
    Double sumStockValueByWarehouse(@Param("warehouseId") int warehouseId);

    @Query("SELECT s FROM InventorySnapshot s WHERE s.quantity <= :threshold AND s.snapshotDate = (SELECT MAX(sub.snapshotDate) FROM InventorySnapshot sub)")
    List<InventorySnapshot> findLowStockSnapshot(@Param("threshold") int threshold);

    // Placeholder for turnover calculation logic
    @Query("SELECT AVG(s.stockValue) FROM InventorySnapshot s WHERE s.productId = :productId")
    Double avgValueByProduct(@Param("productId") int productId);
}
