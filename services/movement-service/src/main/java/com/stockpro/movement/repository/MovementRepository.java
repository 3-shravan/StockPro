package com.stockpro.movement.repository;

import com.stockpro.movement.entity.MovementType;
import com.stockpro.movement.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MovementRepository extends JpaRepository<StockMovement, Integer> {

  List<StockMovement> findByProductId(int productId);

  List<StockMovement> findByWarehouseId(int warehouseId);

  List<StockMovement> findByMovementType(MovementType movementType);

  List<StockMovement> findByReferenceId(int referenceId);

  List<StockMovement> findByMovementDateBetween(LocalDateTime start, LocalDateTime end);

  List<StockMovement> findByPerformedBy(int userId);

  @Query("SELECT COUNT(sm) FROM StockMovement sm WHERE sm.productId = :productId AND sm.movementType = :movementType")
  int countByProductIdAndType(@Param("productId") int productId, @Param("movementType") MovementType movementType);

  @Query("SELECT COALESCE(SUM(sm.quantity),0) FROM StockMovement sm WHERE sm.productId = :productId AND sm.movementType = :movementType")
  int sumQuantityByProductIdAndMovementType(@Param("productId") int productId,
      @Param("movementType") MovementType movementType);

  List<StockMovement> findByProductIdAndWarehouseIdOrderByMovementDateAscMovementIdAsc(int productId, int warehouseId);
}
