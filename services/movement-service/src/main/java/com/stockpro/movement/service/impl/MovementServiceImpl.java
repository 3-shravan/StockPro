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

import com.stockpro.movement.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MovementServiceImpl implements MovementService {

  private final MovementRepository movementRepository;
  private final MovementMapper movementMapper;
  private final RestTemplate restTemplate;

  @Value("${services.product.url}")
  private String productServiceUrl;

  @Value("${services.warehouse.url}")
  private String warehouseServiceUrl;

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

    // Fetch and persist names at the time of movement for immutable audit trail
    entity.setProductName(getProductName(movementRequest.getProductId()));
    entity.setWarehouseName(getWarehouseName(movementRequest.getWarehouseId()));

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


  private String getProductName(int productId) {
    try {
      String url = productServiceUrl + "/products/" + productId;
      ResponseEntity<ApiResponse<Map<String, Object>>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          org.springframework.http.HttpEntity.EMPTY,
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
      );
      ApiResponse<Map<String, Object>> apiResponse = response.getBody();
      if (apiResponse != null && apiResponse.getData() != null) {
        return (String) apiResponse.getData().get("name");
      }
    } catch (Exception e) {
      log.warn("Failed to fetch product name for ID {}: {}", productId, e.getMessage());
    }
    return "Item #" + productId;
  }

  private String getWarehouseName(int warehouseId) {
    try {
      String url = warehouseServiceUrl + "/warehouses/" + warehouseId;
      ResponseEntity<ApiResponse<Map<String, Object>>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          org.springframework.http.HttpEntity.EMPTY,
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
      );
      ApiResponse<Map<String, Object>> apiResponse = response.getBody();
      if (apiResponse != null && apiResponse.getData() != null) {
        return (String) apiResponse.getData().get("name");
      }
    } catch (Exception e) {
      log.warn("Failed to fetch warehouse name for ID {}: {}", warehouseId, e.getMessage());
    }
    return "WH #" + warehouseId;
  }

  private MovementType parseMovementType(String movementType) {
    try {
      return MovementType.valueOf(movementType.trim().toUpperCase());
    } catch (Exception ex) {
      throw new CustomException("Invalid movement type: " + movementType, HttpStatus.BAD_REQUEST);
    }
  }
}
