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
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        return warehouseService.getWarehouseById(id)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Warehouse found", response)))
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getAll(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        log.info("API: Retrieving warehouses (includeInactive={})", includeInactive);
        List<WarehouseResponse> response = warehouseService.getAllWarehouses(includeInactive);
        return ResponseEntity.ok(ApiResponse.success("Warehouses retrieved successfully", response));
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
        return warehouseService.getStockLevel(warehouseId, productId)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Stock level found", response)))
                .orElseThrow(() -> new CustomException("Stock not found", HttpStatus.NOT_FOUND));
    }

    @GetMapping("/stock/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<StockLevelResponse>>> getStockByProduct(@PathVariable int productId) {
        log.info("API: Retrieving all stock levels for product ID: {}", productId);
        List<StockLevelResponse> response = warehouseService.getStockLevelsByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success("Product stock levels retrieved", response));
    }

    @PutMapping("/stock/update")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> updateStock(@Valid @RequestBody StockUpdateRequest request) {
        log.info("API: Updating stock for warehouse {} product {}: quantity {}",
                request.getWarehouseId(), request.getProductId(), request.getQuantity());
        warehouseService.updateStock(request);
        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", null));
    }

    @PutMapping("/stock/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> adjustStock(@Valid @RequestBody StockUpdateRequest request) {
        log.info("API: Adjusting stock for warehouse {} product {}: delta {}",
                request.getWarehouseId(), request.getProductId(), request.getQuantity());
        warehouseService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", null));
    }

    @PostMapping("/stock/reserve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<Void>> reserveStock(@Valid @RequestBody StockReservationRequest request) {
        log.info("API: Reserving {} units for warehouse {} product {}",
                request.getQuantity(), request.getWarehouseId(), request.getProductId());
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<StockLevelResponse>>> getLowStock(@PathVariable int warehouseId) {
        log.info("API: Retrieving low stock items for warehouse ID: {}", warehouseId);
        List<StockLevelResponse> response = warehouseService.getLowStockItems(warehouseId);
        return ResponseEntity.ok(ApiResponse.success("Low stock items retrieved", response));
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<com.stockpro.warehouse.dto.response.WarehouseStatsResponse>> getStats(@PathVariable int id) {
        log.info("API: Retrieving statistics for warehouse ID: {}", id);
        return ResponseEntity.ok(ApiResponse.success("Warehouse statistics retrieved", warehouseService.getWarehouseStats(id)));
    }

    @PostMapping("/{id}/reconcile")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> reconcile(@PathVariable int id) {
        log.info("API: Reconciling capacity for warehouse ID: {}", id);
        warehouseService.reconcileWarehouseCapacity(id);
        return ResponseEntity.ok(ApiResponse.success("Warehouse capacity reconciled successfully", null));
    }
}
