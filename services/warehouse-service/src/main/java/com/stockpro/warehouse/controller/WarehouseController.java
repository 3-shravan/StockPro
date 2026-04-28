package com.stockpro.warehouse.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

@RestController
@RequestMapping("/warehouses")
@RequiredArgsConstructor
@Slf4j
public class WarehouseController {

    private final WarehouseService warehouseService;

    // --- Warehouse Endpoints ---

    @PostMapping
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(@Valid @RequestBody WarehouseRequest request) {
        log.info("API: Creating new warehouse: {}", request.getName());
        WarehouseResponse response = warehouseService.createWarehouse(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Warehouse created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getById(@PathVariable int id) {
        log.info("API: Retrieving warehouse by ID: {}", id);
        return warehouseService.getById(id)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Warehouse found", response)))
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getAll() {
        log.info("API: Retrieving all active warehouses");
        List<WarehouseResponse> response = warehouseService.getAllWarehouses();
        return ResponseEntity.ok(ApiResponse.success("Warehouses retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> update(@PathVariable int id,
            @Valid @RequestBody WarehouseRequest request) {
        log.info("API: Updating warehouse ID: {}", id);
        WarehouseResponse response = warehouseService.updateWarehouse(id, request);
        return ResponseEntity.ok(ApiResponse.success("Warehouse updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable int id) {
        log.info("API: Deactivating warehouse ID: {}", id);
        warehouseService.deactivateWarehouse(id);
        return ResponseEntity.ok(ApiResponse.success("Warehouse deactivated successfully", null));
    }

    // --- Stock Endpoints (now under /warehouses/stock/...) ---

    @GetMapping("/{warehouseId}/stock/{productId}")
    public ResponseEntity<ApiResponse<StockLevelResponse>> getStock(@PathVariable int warehouseId,
            @PathVariable int productId) {
        log.info("API: Retrieving stock level for warehouse {} and product {}", warehouseId, productId);
        return warehouseService.getStockLevel(warehouseId, productId)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Stock level found", response)))
                .orElseThrow(() -> new CustomException("Stock not found", HttpStatus.NOT_FOUND));
    }

    @PutMapping("/stock/update")
    public ResponseEntity<ApiResponse<Void>> updateStock(@Valid @RequestBody StockUpdateRequest request) {
        log.info("API: Updating stock for warehouse {} product {}: quantity {}", 
                request.getWarehouseId(), request.getProductId(), request.getQuantity());
        warehouseService.updateStock(request.getWarehouseId(), request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", null));
    }

    @PutMapping("/stock/adjust")
    public ResponseEntity<ApiResponse<Void>> adjustStock(@Valid @RequestBody StockUpdateRequest request) {
        log.info("API: Adjusting stock for warehouse {} product {}: delta {}", 
                request.getWarehouseId(), request.getProductId(), request.getQuantity());
        warehouseService.adjustStock(request.getWarehouseId(), request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", null));
    }

    @PostMapping("/stock/reserve")
    public ResponseEntity<ApiResponse<Void>> reserveStock(@Valid @RequestBody StockReservationRequest request) {
        log.info("API: Reserving {} units for warehouse {} product {}", 
                request.getQuantity(), request.getWarehouseId(), request.getProductId());
        warehouseService.reserveStock(request.getWarehouseId(), request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("Stock reserved successfully", null));
    }

    @PostMapping("/stock/transfer")
    public ResponseEntity<ApiResponse<Void>> transferStock(@Valid @RequestBody StockTransferRequest request) {
        log.info("API: Transferring {} units of product {} from warehouse {} to {}", 
                request.getQuantity(), request.getProductId(), request.getFromWarehouseId(), request.getToWarehouseId());
        warehouseService.transferStock(request.getFromWarehouseId(), request.getToWarehouseId(),
                request.getProductId(), request.getQuantity(), request.getManagerId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Stock transferred successfully", null));
    }

    @GetMapping("/{warehouseId}/stock/low")
    public ResponseEntity<ApiResponse<List<StockLevelResponse>>> getLowStock(@PathVariable int warehouseId) {
        log.info("API: Retrieving low stock items for warehouse ID: {}", warehouseId);
        List<StockLevelResponse> response = warehouseService.getLowStockItems(warehouseId);
        return ResponseEntity.ok(ApiResponse.success("Low stock items retrieved", response));
    }
}

