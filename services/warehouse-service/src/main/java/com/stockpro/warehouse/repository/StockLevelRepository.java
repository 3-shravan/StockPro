package com.stockpro.warehouse.repository;

import com.stockpro.warehouse.entity.StockLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StockLevelRepository extends JpaRepository<StockLevel, Integer> {
    Optional<StockLevel> findByWarehouseIdAndProductId(int warehouseId, int productId);
}
