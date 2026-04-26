package com.stockpro.movement.service;

import com.stockpro.movement.dto.request.StockMovementRequest;
import com.stockpro.movement.dto.response.StockMovementResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface MovementService {

  StockMovementResponse recordMovement(StockMovementRequest movementRequest);

  List<StockMovementResponse> getByProduct(int productId);

  List<StockMovementResponse> getByWarehouse(int warehouseId);

  List<StockMovementResponse> getByType(String movementType);

  List<StockMovementResponse> getByDateRange(LocalDateTime start, LocalDateTime end);

  List<StockMovementResponse> getByReference(int referenceId);

  List<StockMovementResponse> getMovementHistory(int productId, int warehouseId);

  int getStockIn(int productId);

  int getStockOut(int productId);

  List<StockMovementResponse> getAllMovements();
}
