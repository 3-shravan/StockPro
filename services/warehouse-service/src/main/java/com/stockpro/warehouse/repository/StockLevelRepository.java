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
}
