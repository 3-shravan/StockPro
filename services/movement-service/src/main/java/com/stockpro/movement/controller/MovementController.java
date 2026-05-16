package com.stockpro.movement.controller;

import com.stockpro.movement.common.response.ApiResponse;
import com.stockpro.movement.dto.request.StockMovementRequest;
import com.stockpro.movement.dto.response.StockMovementResponse;
import com.stockpro.movement.service.MovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/movements")
@RequiredArgsConstructor
@Slf4j
public class MovementController {

  private final MovementService movementService;

  @Value("${stockpro.security.internal-secret}")
  private String internalSecret;

  /** All warehouse-facing roles can record stock movements. */
  @PostMapping
  @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
  public ResponseEntity<ApiResponse<StockMovementResponse>> record(@Valid @RequestBody StockMovementRequest request) {
    log.info("API: recording movement for productId={}, warehouseId={}", request.getProductId(),
        request.getWarehouseId());
    
    if (!isAuthorizedForWarehouse(request.getWarehouseId())) {
      log.warn("Access denied: User not authorized to record movement for warehouse {}", request.getWarehouseId());
      throw new com.stockpro.movement.exception.CustomException("Access denied: you can only record movements for your assigned warehouse", HttpStatus.FORBIDDEN);
    }

    StockMovementResponse response = movementService.recordMovement(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(HttpStatus.CREATED.value(), "Stock movement recorded successfully", response));
  }

  @GetMapping("/product/{id}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByProduct(@PathVariable int id) {
    List<StockMovementResponse> movements = movementService.getByProduct(id).stream()
        .filter(m -> isAuthorizedForWarehouse(m.getWarehouseId()))
        .collect(java.util.stream.Collectors.toList());
    return ResponseEntity.ok(ApiResponse.success("Movements retrieved successfully", movements));
  }

  @GetMapping("/warehouse/{id}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByWarehouse(@PathVariable int id) {
    if (!isAuthorizedForWarehouse(id)) {
      log.warn("Access denied: User not authorized to view movements for warehouse {}", id);
      throw new com.stockpro.movement.exception.CustomException("Access denied: you are not authorized to view movements for this warehouse hub", HttpStatus.FORBIDDEN);
    }
    return ResponseEntity
        .ok(ApiResponse.success("Movements retrieved successfully", movementService.getByWarehouse(id)));
  }

  @GetMapping("/type/{type}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByType(@PathVariable String type) {
    List<StockMovementResponse> movements = movementService.getByType(type).stream()
        .filter(m -> isAuthorizedForWarehouse(m.getWarehouseId()))
        .collect(java.util.stream.Collectors.toList());
    return ResponseEntity.ok(ApiResponse.success("Movements retrieved successfully", movements));
  }

  @GetMapping("/date-range")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByDateRange(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
    List<StockMovementResponse> movements = movementService.getByDateRange(start, end).stream()
        .filter(m -> isAuthorizedForWarehouse(m.getWarehouseId()))
        .collect(java.util.stream.Collectors.toList());
    return ResponseEntity
        .ok(ApiResponse.success("Movements retrieved successfully", movements));
  }

  @GetMapping("/reference/{id}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByReference(@PathVariable int id) {
    List<StockMovementResponse> movements = movementService.getByReference(id).stream()
        .filter(m -> isAuthorizedForWarehouse(m.getWarehouseId()))
        .collect(java.util.stream.Collectors.toList());
    return ResponseEntity
        .ok(ApiResponse.success("Movements retrieved successfully", movements));
  }

  @GetMapping("/history/{productId}/{warehouseId}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getHistory(@PathVariable int productId,
      @PathVariable int warehouseId) {
    
    if (!isAuthorizedForWarehouse(warehouseId)) {
      log.warn("Access denied: User not authorized to view history for warehouse {}", warehouseId);
      throw new com.stockpro.movement.exception.CustomException("Access denied: you are not authorized to view history for this warehouse hub", HttpStatus.FORBIDDEN);
    }

    return ResponseEntity.ok(ApiResponse.success("Movement history retrieved successfully",
        movementService.getMovementHistory(productId, warehouseId)));
  }

  @GetMapping("/stock-in/{productId}")
  public ResponseEntity<ApiResponse<Integer>> getStockIn(@PathVariable int productId) {
    return ResponseEntity.ok(ApiResponse.success("Stock-in total retrieved successfully",
        movementService.getStockIn(productId)));
  }

  @GetMapping("/stock-out/{productId}")
  public ResponseEntity<ApiResponse<Integer>> getStockOut(@PathVariable int productId) {
    return ResponseEntity.ok(ApiResponse.success("Stock-out total retrieved successfully",
        movementService.getStockOut(productId)));
  }

  /** Full audit trail — Management, Staff and Officers can view history. */
  @GetMapping
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'STAFF', 'OFFICER')")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getAll() {
    log.info("API: Listing all stock movements");
    
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    boolean isOfficer = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));
    boolean isManager = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));
    
    if (isAdmin || isOfficer) {
      return ResponseEntity.ok(ApiResponse.success("All movements retrieved successfully", movementService.getAllMovements()));
    } else if (isManager) {
      int userId = getCurrentUserId();
      List<Integer> warehouseIds = getManagedWarehouseIds(userId);
      log.info("Scoping movement list to manager ID: {} ({} warehouses)", userId, warehouseIds.size());
      
      List<StockMovementResponse> movements = warehouseIds.stream()
          .flatMap(id -> movementService.getByWarehouse(id).stream())
          .collect(java.util.stream.Collectors.toList());
          
      return ResponseEntity.ok(ApiResponse.success("Aggregated warehouse movements retrieved successfully", movements));
    } else {
      String department = getCurrentUserDepartment();
      if (department != null && !department.isBlank() && !department.equalsIgnoreCase("GLOBAL HUB (UNASSIGNED)")) {
        Integer warehouseId = resolveWarehouseIdByName(department);
        if (warehouseId != null) {
          return ResponseEntity.ok(ApiResponse.success("Warehouse movements retrieved successfully", movementService.getByWarehouse(warehouseId)));
        }
      }
      return ResponseEntity.ok(ApiResponse.success("Movements retrieved successfully", List.of()));
    }
  }

  private List<Integer> getManagedWarehouseIds(int managerId) {
    try {
      String url = warehouseServiceUrl + "/warehouses";
      
      ResponseEntity<com.stockpro.movement.common.response.ApiResponse<List<java.util.Map<String, Object>>>> res = 
          restTemplate.exchange(url, HttpMethod.GET, createInternalRequestEntity(null), 
          new org.springframework.core.ParameterizedTypeReference<com.stockpro.movement.common.response.ApiResponse<List<java.util.Map<String, Object>>>>() {});
      
      if (res.getBody() != null && res.getBody().getData() != null) {
        return res.getBody().getData().stream()
            .filter(w -> {
              Object mId = w.get("managerId");
              return mId instanceof Number && ((Number) mId).intValue() == managerId;
            })
            .map(w -> (Integer) w.get("warehouseId"))
            .collect(java.util.stream.Collectors.toList());
      }
    } catch (Exception e) {
      log.error("Failed to fetch managed warehouses for manager {}: {}", managerId, e.getMessage());
    }
    return List.of();
  }

  @Value("${services.warehouse.url}")
  private String warehouseServiceUrl;

  private final org.springframework.web.client.RestTemplate restTemplate;

  private String getCurrentUserDepartment() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getDetails() instanceof java.util.Map) {
      @SuppressWarnings("unchecked")
      java.util.Map<String, Object> details = (java.util.Map<String, Object>) auth.getDetails();
      Object deptObj = details.get("department");
      if (deptObj instanceof String) {
        return (String) deptObj;
      }
    }
    return null;
  }

  private Integer resolveWarehouseIdByName(String name) {
    try {
      String url = warehouseServiceUrl + "/warehouses";
      
      ResponseEntity<com.stockpro.movement.common.response.ApiResponse<List<java.util.Map<String, Object>>>> res = 
          restTemplate.exchange(url, HttpMethod.GET, createInternalRequestEntity(null), 
          new org.springframework.core.ParameterizedTypeReference<com.stockpro.movement.common.response.ApiResponse<List<java.util.Map<String, Object>>>>() {});
      
      if (res.getBody() != null && res.getBody().getData() != null) {
        return res.getBody().getData().stream()
            .filter(w -> name.equalsIgnoreCase((String) w.get("name")))
            .map(w -> (Integer) w.get("warehouseId"))
            .findFirst()
            .orElse(null);
      }
    } catch (Exception e) {
      log.error("Failed to resolve warehouse ID for name {}: {}", name, e.getMessage());
    }
    return null;
  }

  /**
   * Checks if the current user has access to a specific warehouse ID.
   * High-level roles (ADMIN, OFFICER) have global access.
   */
  private boolean isAuthorizedForWarehouse(int warehouseId) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) return false;
    
    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    boolean isOfficer = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));
    
    if (isAdmin || isOfficer) return true;

    String department = getCurrentUserDepartment();
    int userId = getCurrentUserId();

    // 1. Check Manager assignment (via warehouse-service)
    try {
      String url = warehouseServiceUrl + "/warehouses/" + warehouseId;
      
      ResponseEntity<com.stockpro.movement.common.response.ApiResponse<java.util.Map<String, Object>>> res = 
          restTemplate.exchange(url, HttpMethod.GET, createInternalRequestEntity(null), 
          new org.springframework.core.ParameterizedTypeReference<com.stockpro.movement.common.response.ApiResponse<java.util.Map<String, Object>>>() {});
      
      if (res.getBody() != null && res.getBody().getData() != null) {
        Object mId = res.getBody().getData().get("managerId");
        if (mId instanceof Number && ((Number) mId).intValue() == userId) {
          return true;
        }
      }
    } catch (Exception e) {
      log.error("Failed to verify manager assignment for warehouse {}: {}", warehouseId, e.getMessage());
    }

    // 2. Check Staff assignment (via department match)
    if (department != null && !department.isBlank() && !department.equalsIgnoreCase("GLOBAL HUB (UNASSIGNED)")) {
      Integer assignedId = resolveWarehouseIdByName(department);
      return assignedId != null && assignedId == warehouseId;
    }

    return false;
  }

  private int getCurrentUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getDetails() instanceof java.util.Map) {
      @SuppressWarnings("unchecked")
      java.util.Map<String, Object> details = (java.util.Map<String, Object>) auth.getDetails();
      Object userIdObj = details.get("userId");
      if (userIdObj instanceof Integer) {
        return (Integer) userIdObj;
      } else if (userIdObj instanceof String) {
        try {
          return Integer.parseInt((String) userIdObj);
        } catch (NumberFormatException e) {
          log.error("Failed to parse userId string: {}", userIdObj);
        }
      }
    }
    return 0;
  }

  private <T> HttpEntity<T> createInternalRequestEntity(T body) {
    HttpHeaders headers = new HttpHeaders();
    headers.set("X-Internal-Gateway-Secret", internalSecret);
    
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null) {
      headers.set("X-User-Name", auth.getName());
      String roles = auth.getAuthorities().stream()
          .map(a -> a.getAuthority().replace("ROLE_", ""))
          .collect(java.util.stream.Collectors.joining(","));
      headers.set("X-User-Roles", roles);
      
      int userId = getCurrentUserId();
      if (userId > 0) headers.set("X-User-Id", String.valueOf(userId));
      
      String department = getCurrentUserDepartment();
      if (department != null) headers.set("X-User-Department", department);
    }
    return new HttpEntity<>(body, headers);
  }
}
