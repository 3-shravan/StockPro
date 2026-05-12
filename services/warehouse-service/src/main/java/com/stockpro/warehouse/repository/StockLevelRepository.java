package com.stockpro.warehouse.repository;

import com.stockpro.warehouse.entity.StockLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockLevelRepository extends JpaRepository<StockLevel, Integer> {
    Optional<StockLevel> findByWarehouseIdAndProductId(int warehouseId, int productId);

    @Query("SELECT s FROM StockLevel s WHERE (s.quantity - s.reservedQuantity) < :threshold")
    List<StockLevel> findAllBelowAvailableThreshold(@Param("threshold") int threshold);

    @Query("SELECT s FROM StockLevel s WHERE (s.quantity - s.reservedQuantity) > :threshold")
    List<StockLevel> findAllAboveAvailableThreshold(@Param("threshold") int threshold);

    @Query("SELECT s FROM StockLevel s WHERE s.warehouseId = :warehouseId AND (s.quantity - s.reservedQuantity) < :threshold")
    List<StockLevel> findLowStockByWarehouse(@Param("warehouseId") int warehouseId, @Param("threshold") int threshold);

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM StockLevel s WHERE s.warehouseId = :warehouseId")
    int sumQuantityByWarehouseId(@Param("warehouseId") int warehouseId);

    @Query("SELECT COUNT(DISTINCT s.productId) FROM StockLevel s WHERE s.warehouseId = :warehouseId")
    int countUniqueProductsByWarehouseId(@Param("warehouseId") int warehouseId);

    @Query(value = "SELECT * FROM stock_levels WHERE warehouse_id = :warehouseId ORDER BY quantity DESC LIMIT :limit", nativeQuery = true)
    List<StockLevel> findTopProductsByWarehouseId(@Param("warehouseId") int warehouseId, @Param("limit") int limit);

    @Query("SELECT s.warehouseId, COALESCE(SUM(s.quantity), 0) FROM StockLevel s GROUP BY s.warehouseId")
    List<Object[]> sumQuantitiesByWarehouse();

    List<StockLevel> findByProductId(int productId);

    void deleteByWarehouseId(int warehouseId);
}
