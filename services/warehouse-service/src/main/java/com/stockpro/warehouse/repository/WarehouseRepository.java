package com.stockpro.warehouse.repository;

import com.stockpro.warehouse.entity.StockLevel;
import com.stockpro.warehouse.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Integer> {

    Optional<Warehouse> findByWarehouseId(int warehouseId);

    List<Warehouse> findByManagerId(int managerId);

    List<Warehouse> findByActive(boolean isActive);

    List<Warehouse> findByLocation(String location);

    long countByActive(boolean isActive);

    @Query("SELECT s FROM StockLevel s WHERE s.warehouseId = :warehouseId AND s.productId = :productId")
    Optional<StockLevel> findStockByWarehouseAndProduct(int warehouseId, int productId);

    @Query("SELECT s FROM StockLevel s WHERE s.warehouseId = :warehouseId AND (s.quantity - s.reservedQuantity) < 10")
    List<StockLevel> findLowStockItems(int warehouseId);
}
