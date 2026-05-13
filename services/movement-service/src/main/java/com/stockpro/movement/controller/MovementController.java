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

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/movements")
@RequiredArgsConstructor
@Slf4j
public class MovementController {

  private final MovementService movementService;

  /** All warehouse-facing roles can record stock movements. */
  @PostMapping
  @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
  public ResponseEntity<ApiResponse<StockMovementResponse>> record(@Valid @RequestBody StockMovementRequest request) {
    log.info("API: recording movement for productId={}, warehouseId={}", request.getProductId(),
        request.getWarehouseId());
    StockMovementResponse response = movementService.recordMovement(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(HttpStatus.CREATED.value(), "Stock movement recorded successfully", response));
  }

  @GetMapping("/product/{id}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByProduct(@PathVariable int id) {
    return ResponseEntity.ok(ApiResponse.success("Movements retrieved successfully", movementService.getByProduct(id)));
  }

  @GetMapping("/warehouse/{id}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByWarehouse(@PathVariable int id) {
    return ResponseEntity
        .ok(ApiResponse.success("Movements retrieved successfully", movementService.getByWarehouse(id)));
  }

  @GetMapping("/type/{type}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByType(@PathVariable String type) {
    return ResponseEntity.ok(ApiResponse.success("Movements retrieved successfully", movementService.getByType(type)));
  }

  @GetMapping("/date-range")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByDateRange(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
    return ResponseEntity
        .ok(ApiResponse.success("Movements retrieved successfully", movementService.getByDateRange(start, end)));
  }

  @GetMapping("/reference/{id}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getByReference(@PathVariable int id) {
    return ResponseEntity
        .ok(ApiResponse.success("Movements retrieved successfully", movementService.getByReference(id)));
  }

  @GetMapping("/history/{productId}/{warehouseId}")
  public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getHistory(@PathVariable int productId,
      @PathVariable int warehouseId) {
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
    
    if (isAdmin || isOfficer) {
      return ResponseEntity.ok(ApiResponse.success("All movements retrieved successfully", movementService.getAllMovements()));
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
      org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
      headers.set("X-Internal-Gateway-Secret", "StockProGateway2024");
      headers.set("X-User-Name", "system");
      headers.set("X-User-Roles", "ADMIN");
      org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
      
      ResponseEntity<com.stockpro.movement.common.response.ApiResponse<List<java.util.Map<String, Object>>>> res = 
          restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, 
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
}
