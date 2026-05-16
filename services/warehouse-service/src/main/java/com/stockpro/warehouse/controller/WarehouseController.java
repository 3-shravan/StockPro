package com.stockpro.warehouse.controller;

import com.stockpro.warehouse.common.response.ApiResponse;
import com.stockpro.warehouse.dto.request.StockReservationRequest;
import com.stockpro.warehouse.dto.request.StockTransferRequest;
import com.stockpro.warehouse.dto.request.StockUpdateRequest;
import com.stockpro.warehouse.dto.request.WarehouseRequest;
import com.stockpro.warehouse.dto.response.StockLevelResponse;
import com.stockpro.warehouse.dto.response.WarehouseResponse;
import com.stockpro.warehouse.exception.CustomException;
import com.stockpro.warehouse.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/warehouses")
@RequiredArgsConstructor
@Slf4j
public class WarehouseController {

    private final WarehouseService warehouseService;

    // --- Warehouse CRUD Endpoints ---

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(@Valid @RequestBody WarehouseRequest request) {
        log.info("API: Creating new warehouse: {}", request.getName());
        WarehouseResponse response = warehouseService.createWarehouse(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Warehouse created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getById(@PathVariable int id) {
        log.info("API: Retrieving warehouse by ID: {}", id);
        
        if (!isAuthorizedForWarehouse(id)) {
            log.warn("Access denied for warehouse ID: {}", id);
            throw new CustomException("Access denied: you are not authorized to access this warehouse hub", HttpStatus.FORBIDDEN);
        }

        return warehouseService.getWarehouseById(id)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Warehouse found", response)))
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getAll(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        log.info("API: Retrieving warehouses (includeInactive={})", includeInactive);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOfficer = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));

        List<WarehouseResponse> response;
        if (isAdmin || isOfficer) {
            // High-level roles see everything
            response = warehouseService.getAllWarehouses(includeInactive);
        } else if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"))) {
            // Managers see hubs they are assigned to
            int managerId = getCurrentUserId();
            log.info("Scoping warehouse list to manager ID: {}", managerId);
            response = warehouseService.getWarehousesByManager(managerId, includeInactive);
        } else {
            // Staff see hubs matching their department
            String department = getCurrentUserDepartment();
            log.info("Scoping warehouse list to department: {}", department);
            
            if (department != null && !department.isBlank() && !department.equalsIgnoreCase("GLOBAL HUB (UNASSIGNED)")) {
                response = warehouseService.getAllWarehouses(includeInactive).stream()
                        .filter(w -> department.equalsIgnoreCase(w.getName()))
                        .collect(Collectors.toList());
            } else {
                response = List.of();
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Warehouses retrieved successfully", response));
    }

    private String getCurrentUserDepartment() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            Object deptObj = details.get("department");
            if (deptObj instanceof String) {
                return (String) deptObj;
            }
        }
        return null;
    }

    private int getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
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

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> update(@PathVariable int id,
            @Valid @RequestBody WarehouseRequest request) {
        log.info("API: Updating warehouse ID: {}", id);
        WarehouseResponse response = warehouseService.updateWarehouse(id, request);
        return ResponseEntity.ok(ApiResponse.success("Warehouse updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable int id) {
        log.info("API: Deactivating warehouse ID: {}", id);
        warehouseService.deactivateWarehouse(id);
        return ResponseEntity.ok(ApiResponse.success("Warehouse deactivated successfully", null));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable int id) {
        log.info("API: Activating warehouse ID: {}", id);
        warehouseService.activateWarehouse(id);
        return ResponseEntity.ok(ApiResponse.success("Warehouse activated successfully", null));
    }

    @DeleteMapping("/{id}/hard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> hardDelete(@PathVariable int id) {
        log.info("API: Hard deleting warehouse ID: {}", id);
        warehouseService.deleteWarehouse(id);
        return ResponseEntity.ok(ApiResponse.success("Warehouse permanently deleted", null));
    }

    // --- Stock Endpoints ---

    @GetMapping("/{warehouseId}/stock/{productId}")
    public ResponseEntity<ApiResponse<StockLevelResponse>> getStock(@PathVariable int warehouseId,
            @PathVariable int productId) {
        log.info("API: Retrieving stock level for warehouse {} and product {}", warehouseId, productId);
        
        if (!isAuthorizedForWarehouse(warehouseId)) {
            throw new CustomException("Access denied: you are not authorized to view stock for this warehouse hub", HttpStatus.FORBIDDEN);
        }

        return warehouseService.getStockLevel(warehouseId, productId)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Stock level found", response)))
                .orElseThrow(() -> new CustomException("Stock not found", HttpStatus.NOT_FOUND));
    }

    @GetMapping("/{warehouseId}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<StockLevelResponse>>> getAllStockByWarehouse(
            @PathVariable int warehouseId) {
        log.info("API: Retrieving all stock levels for warehouse {}", warehouseId);
        
        if (!isAuthorizedForWarehouse(warehouseId)) {
            throw new CustomException("Access denied: you are not authorized to view stock for this warehouse hub", HttpStatus.FORBIDDEN);
        }

        List<StockLevelResponse> response = warehouseService.getAllStockByWarehouse(warehouseId);
        return ResponseEntity.ok(ApiResponse.success("Stock levels retrieved", response));
    }

    @GetMapping("/stock/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<StockLevelResponse>>> getStockByProduct(@PathVariable int productId) {
        log.info("API: Retrieving all stock levels for product ID: {}", productId);
        List<StockLevelResponse> response = warehouseService.getStockLevelsByProductId(productId).stream()
                .filter(s -> isAuthorizedForWarehouse(s.getWarehouseId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Product stock levels retrieved", response));
    }

    @PutMapping("/stock/update")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> updateStock(@Valid @RequestBody StockUpdateRequest request) {
        log.info("API: Updating stock for warehouse {} product {}: quantity {}",
                request.getWarehouseId(), request.getProductId(), request.getQuantity());
        
        if (!isAuthorizedForWarehouse(request.getWarehouseId())) {
            throw new CustomException("Access denied: you can only update stock for your assigned warehouse hub", HttpStatus.FORBIDDEN);
        }

        warehouseService.updateStock(request);
        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", null));
    }

    @PutMapping("/stock/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> adjustStock(@Valid @RequestBody StockUpdateRequest request) {
        log.info("API: Adjusting stock for warehouse {} product {}: delta {}",
                request.getWarehouseId(), request.getProductId(), request.getQuantity());
        
        if (!isAuthorizedForWarehouse(request.getWarehouseId())) {
            throw new CustomException("Access denied: you can only adjust stock for your assigned warehouse hub", HttpStatus.FORBIDDEN);
        }

        warehouseService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", null));
    }

    @PostMapping("/stock/reserve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> reserveStock(@Valid @RequestBody StockReservationRequest request) {
        log.info("API: Reserving {} units for warehouse {} product {}",
                request.getQuantity(), request.getWarehouseId(), request.getProductId());
        
        if (!isAuthorizedForWarehouse(request.getWarehouseId())) {
            throw new CustomException("Access denied: you can only reserve stock for your assigned warehouse hub", HttpStatus.FORBIDDEN);
        }

        warehouseService.reserveStock(request.getWarehouseId(), request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Stock reserved successfully", null));
    }

    @PostMapping("/stock/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> transferStock(@Valid @RequestBody StockTransferRequest request) {
        log.info("API: Transferring {} units of product {} from warehouse {} to {}",
                request.getQuantity(), request.getProductId(), request.getFromWarehouseId(), request.getToWarehouseId());
        warehouseService.transferStock(request.getFromWarehouseId(), request.getToWarehouseId(),
                request.getProductId(), request.getQuantity());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock transferred successfully", null));
    }

    @GetMapping("/{warehouseId}/stock/low")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<StockLevelResponse>>> getLowStock(@PathVariable int warehouseId) {
        log.info("API: Retrieving low stock items for warehouse ID: {}", warehouseId);
        
        if (!isAuthorizedForWarehouse(warehouseId)) {
            throw new CustomException("Access denied: you are not authorized to view logs for this warehouse hub", HttpStatus.FORBIDDEN);
        }

        List<StockLevelResponse> response = warehouseService.getLowStockItems(warehouseId);
        return ResponseEntity.ok(ApiResponse.success("Low stock items retrieved", response));
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'OFFICER')")
    public ResponseEntity<ApiResponse<com.stockpro.warehouse.dto.response.WarehouseStatsResponse>> getStats(@PathVariable int id) {
        log.info("API: Retrieving statistics for warehouse ID: {}", id);
        
        if (!isAuthorizedForWarehouse(id)) {
            throw new CustomException("Access denied: you are not authorized to view statistics for this warehouse hub", HttpStatus.FORBIDDEN);
        }

        return ResponseEntity.ok(ApiResponse.success("Warehouse statistics retrieved", warehouseService.getWarehouseStats(id)));
    }

    @PostMapping("/{id}/reconcile")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> reconcile(@PathVariable int id) {
        log.info("API: Reconciling capacity for warehouse ID: {}", id);
        
        if (!isAuthorizedForWarehouse(id)) {
            throw new CustomException("Access denied: you are not authorized to perform operations on this warehouse hub", HttpStatus.FORBIDDEN);
        }

        warehouseService.reconcileWarehouseCapacity(id);
        return ResponseEntity.ok(ApiResponse.success("Warehouse capacity reconciled successfully", null));
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
        
        return warehouseService.getWarehouseById(warehouseId)
                .map(w -> {
                    // Check managerId first (Direct assignment)
                    if (w.getManagerId() != null && w.getManagerId() == userId) return true;
                    // Check department (Staff assignment)
                    if (department != null && !department.isBlank() && department.equalsIgnoreCase(w.getName())) return true;
                    return false;
                })
                .orElse(false);
    }

}
