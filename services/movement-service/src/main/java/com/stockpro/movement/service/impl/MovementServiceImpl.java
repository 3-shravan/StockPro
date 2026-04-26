package com.stockpro.movement.service.impl;

import com.stockpro.movement.dto.request.StockMovementRequest;
import com.stockpro.movement.dto.response.StockMovementResponse;
import com.stockpro.movement.entity.MovementType;
import com.stockpro.movement.entity.StockMovement;
import com.stockpro.movement.mapper.MovementMapper;
import com.stockpro.movement.repository.MovementRepository;
import com.stockpro.movement.service.MovementService;
import com.stockpro.movement.exception.CustomException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MovementServiceImpl implements MovementService {

  private final MovementRepository movementRepository;
  private final MovementMapper movementMapper;

  @Override
  @Transactional
  public StockMovementResponse recordMovement(StockMovementRequest movementRequest) {
    log.info("Recording stock movement for productId={}, warehouseId={}, type={}",
        movementRequest.getProductId(), movementRequest.getWarehouseId(), movementRequest.getMovementType());

    StockMovement entity;
    try {
      entity = movementMapper.toEntity(movementRequest);
    } catch (IllegalArgumentException ex) {
      throw new CustomException("Invalid movement type: " + movementRequest.getMovementType(), HttpStatus.BAD_REQUEST);
    }

    StockMovement saved = movementRepository.save(entity);
    return movementMapper.toResponse(saved);
  }

  @Override
  public List<StockMovementResponse> getByProduct(int productId) {
    return movementRepository.findByProductId(productId).stream()
        .map(movementMapper::toResponse)
        .toList();
  }

  @Override
  public List<StockMovementResponse> getByWarehouse(int warehouseId) {
    return movementRepository.findByWarehouseId(warehouseId).stream()
        .map(movementMapper::toResponse)
        .toList();
  }

  @Override
  public List<StockMovementResponse> getByType(String movementType) {
    MovementType normalizedType = parseMovementType(movementType);
    return movementRepository.findByMovementType(normalizedType).stream()
        .map(movementMapper::toResponse)
        .toList();
  }

  @Override
  public List<StockMovementResponse> getByDateRange(LocalDateTime start, LocalDateTime end) {
    if (start.isAfter(end)) {
      throw new CustomException("Start date must be before end date", HttpStatus.BAD_REQUEST);
    }
    return movementRepository.findByMovementDateBetween(start, end).stream()
        .map(movementMapper::toResponse)
        .toList();
  }

  @Override
  public List<StockMovementResponse> getByReference(int referenceId) {
    return movementRepository.findByReferenceId(referenceId).stream()
        .map(movementMapper::toResponse)
        .toList();
  }

  @Override
  public List<StockMovementResponse> getMovementHistory(int productId, int warehouseId) {
    return movementRepository.findByProductIdAndWarehouseIdOrderByMovementDateAscMovementIdAsc(productId, warehouseId)
        .stream()
        .map(movementMapper::toResponse)
        .toList();
  }

  @Override
  public int getStockIn(int productId) {
    return movementRepository.sumQuantityByProductIdAndMovementType(productId, MovementType.STOCK_IN);
  }

  @Override
  public int getStockOut(int productId) {
    return movementRepository.sumQuantityByProductIdAndMovementType(productId, MovementType.STOCK_OUT);
  }

  @Override
  public List<StockMovementResponse> getAllMovements() {
    return movementRepository.findAll(Sort.by(Sort.Order.desc("movementDate"), Sort.Order.desc("movementId"))).stream()
        .map(movementMapper::toResponse)
        .toList();
  }

  private MovementType parseMovementType(String movementType) {
    try {
      return MovementType.valueOf(movementType.trim().toUpperCase());
    } catch (Exception ex) {
      throw new CustomException("Invalid movement type: " + movementType, HttpStatus.BAD_REQUEST);
    }
  }
}
