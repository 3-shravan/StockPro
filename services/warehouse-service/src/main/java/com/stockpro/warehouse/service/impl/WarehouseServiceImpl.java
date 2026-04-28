package com.stockpro.warehouse.service.impl;

import com.stockpro.warehouse.dto.request.WarehouseRequest;
import com.stockpro.warehouse.dto.response.StockLevelResponse;
import com.stockpro.warehouse.dto.response.WarehouseResponse;
import com.stockpro.warehouse.entity.StockLevel;
import com.stockpro.warehouse.entity.Warehouse;
import com.stockpro.warehouse.exception.CustomException;
import com.stockpro.warehouse.mapper.StockMapper;
import com.stockpro.warehouse.mapper.WarehouseMapper;
import com.stockpro.warehouse.repository.StockLevelRepository;
import com.stockpro.warehouse.repository.WarehouseRepository;
import com.stockpro.warehouse.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final StockLevelRepository stockLevelRepository;
    private final WarehouseMapper warehouseMapper;
    private final StockMapper stockMapper;
    private final RestTemplate restTemplate;

    @Value("${services.alert.url}")
    private String alertServiceUrl;

    @Value("${stock.alert.low-threshold:10}")
    private int lowStockThreshold;

    @Value("${stock.alert.overstock-threshold:200}")
    private int overstockThreshold;

    @Override
    @Transactional
    public WarehouseResponse createWarehouse(WarehouseRequest request) {
        log.info("Creating new warehouse: {}", request.getName());
        Warehouse warehouse = warehouseMapper.toEntity(request);
        Warehouse saved = warehouseRepository.save(warehouse);
        return warehouseMapper.toResponse(saved);
    }

    @Override
    public Optional<WarehouseResponse> getById(int warehouseId) {
        log.debug("Service: Fetching warehouse by ID: {}", warehouseId);
        return warehouseRepository.findByWarehouseId(warehouseId)
                .map(warehouseMapper::toResponse);
    }

    @Override
    public List<WarehouseResponse> getAllWarehouses() {
        log.debug("Service: Fetching all active warehouses");
        return warehouseRepository.findAll().stream()
                .map(warehouseMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WarehouseResponse updateWarehouse(int warehouseId, WarehouseRequest request) {
        log.info("Updating warehouse ID: {}", warehouseId);
        Warehouse warehouse = warehouseRepository.findByWarehouseId(warehouseId)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));

        warehouseMapper.updateEntity(request, warehouse);
        Warehouse updated = warehouseRepository.save(warehouse);
        return warehouseMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deactivateWarehouse(int warehouseId) {
        log.info("Deactivating warehouse ID: {}", warehouseId);
        Warehouse warehouse = warehouseRepository.findByWarehouseId(warehouseId)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));

        if (!warehouse.isActive()) {
            throw new CustomException("Warehouse already deactivated", HttpStatus.BAD_REQUEST);
        }

        warehouse.setActive(false);
        warehouseRepository.save(warehouse);
    }

    @Override
    public Optional<StockLevelResponse> getStockLevel(int warehouseId, int productId) {
        log.debug("Service: Fetching stock level for warehouse {} and product {}", warehouseId, productId);
        return stockLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .map(stockMapper::toResponse);
    }

    @Override
    @Transactional
    public void updateStock(int warehouseId, int productId, int quantity) {
        log.info("Updating stock for warehouse {} product {}: new quantity {}", warehouseId, productId, quantity);
        StockLevel stockLevel = getOrCreateStockLevel(warehouseId, productId);
        stockLevel.setQuantity(quantity);
        stockLevel.setLastUpdated(LocalDateTime.now());
        StockLevel saved = stockLevelRepository.save(stockLevel);
        evaluateAndDispatchStockAlerts(saved);
    }

    @Override
    @Transactional
    public void adjustStock(int warehouseId, int productId, int delta) {
        log.info("Adjusting stock for warehouse {} product {}: delta {}", warehouseId, productId, delta);
        StockLevel stockLevel = getOrCreateStockLevel(warehouseId, productId);
        stockLevel.setQuantity(stockLevel.getQuantity() + delta);
        stockLevel.setLastUpdated(LocalDateTime.now());
        StockLevel saved = stockLevelRepository.save(stockLevel);
        evaluateAndDispatchStockAlerts(saved);
    }

    private StockLevel getOrCreateStockLevel(int warehouseId, int productId) {
        return stockLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .orElse(StockLevel.builder()
                        .warehouseId(warehouseId)
                        .productId(productId)
                        .quantity(0)
                        .reservedQuantity(0)
                        .build());
    }

    @Override
    @Transactional
    public void reserveStock(int warehouseId, int productId, int quantity) {
        log.info("Reserving {} units for warehouse {} product {}", quantity, warehouseId, productId);
        StockLevel stockLevel = stockLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseThrow(() -> new CustomException("Stock level not found for product in this warehouse",
                        HttpStatus.NOT_FOUND));

        if (stockLevel.getAvailableQuantity() < quantity) {
            throw new CustomException("Insufficient available stock for reservation", HttpStatus.BAD_REQUEST);
        }

        stockLevel.setReservedQuantity(stockLevel.getReservedQuantity() + quantity);
        stockLevel.setLastUpdated(LocalDateTime.now());
        StockLevel saved = stockLevelRepository.save(stockLevel);
        evaluateAndDispatchStockAlerts(saved);
    }

    @Override
    @Transactional
    public void releaseReservation(int warehouseId, int productId, int quantity) {
        log.info("Releasing {} units for warehouse {} product {}", quantity, warehouseId, productId);
        StockLevel stockLevel = stockLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseThrow(() -> new CustomException("Stock level not found", HttpStatus.NOT_FOUND));

        if (stockLevel.getReservedQuantity() < quantity) {
            throw new CustomException("Cannot release more than reserved quantity", HttpStatus.BAD_REQUEST);
        }

        stockLevel.setReservedQuantity(stockLevel.getReservedQuantity() - quantity);
        stockLevel.setLastUpdated(LocalDateTime.now());
        StockLevel saved = stockLevelRepository.save(stockLevel);
        evaluateAndDispatchStockAlerts(saved);
    }

    @Override
    @Transactional
    public void transferStock(int fromWarehouseId, int toWarehouseId, int productId, int quantity, int managerId) {
        log.info("Transferring {} units of product {} from warehouse {} to {}", quantity, productId, fromWarehouseId,
                toWarehouseId);

        if (fromWarehouseId == toWarehouseId) {
            throw new CustomException("Source and destination warehouses must be different", HttpStatus.BAD_REQUEST);
        }

        // Debit source
        StockLevel sourceStock = stockLevelRepository.findByWarehouseIdAndProductId(fromWarehouseId, productId)
                .orElseThrow(() -> new CustomException("Source stock not found", HttpStatus.NOT_FOUND));

        if (sourceStock.getAvailableQuantity() < quantity) {
            throw new CustomException("Insufficient stock in source warehouse", HttpStatus.BAD_REQUEST);
        }

        sourceStock.setQuantity(sourceStock.getQuantity() - quantity);
        sourceStock.setLastUpdated(LocalDateTime.now());

        // Credit destination
        StockLevel destStock = stockLevelRepository.findByWarehouseIdAndProductId(toWarehouseId, productId)
                .orElse(StockLevel.builder()
                        .warehouseId(toWarehouseId)
                        .productId(productId)
                        .quantity(0)
                        .reservedQuantity(0)
                        .build());

        destStock.setQuantity(destStock.getQuantity() + quantity);
        destStock.setLastUpdated(LocalDateTime.now());

        StockLevel savedSource = stockLevelRepository.save(sourceStock);
        StockLevel savedDestination = stockLevelRepository.save(destStock);

        evaluateAndDispatchStockAlerts(savedSource);
        evaluateAndDispatchStockAlerts(savedDestination);
    }

    @Override
    public List<StockLevelResponse> getLowStockItems(int warehouseId) {
        log.debug("Service: Fetching low stock items for warehouse ID: {}", warehouseId);
        return warehouseRepository.findLowStockItems(warehouseId).stream()
                .map(stockMapper::toResponse)
                .collect(Collectors.toList());
    }

    private void evaluateAndDispatchStockAlerts(StockLevel stockLevel) {
        int availableQty = stockLevel.getAvailableQuantity();

        if (availableQty < lowStockThreshold) {
            dispatchLowStockAlert(stockLevel.getProductId(), stockLevel.getWarehouseId(), availableQty);
        }

        if (availableQty > overstockThreshold) {
            dispatchOverstockAlert(stockLevel.getProductId(), stockLevel.getWarehouseId(), availableQty);
        }
    }

    private void dispatchLowStockAlert(int productId, int warehouseId, int currentQty) {
        String url = alertServiceUrl + "/alerts/low-stock?productId=" + productId
                + "&warehouseId=" + warehouseId + "&currentQty=" + currentQty;
        try {
            restTemplate.postForEntity(url, null, Void.class);
        } catch (Exception ex) {
            log.warn("Low-stock alert dispatch failed for product {} warehouse {}: {}",
                    productId, warehouseId, ex.getMessage());
        }
    }

    private void dispatchOverstockAlert(int productId, int warehouseId, int currentQty) {
        String url = alertServiceUrl + "/alerts/overstock?productId=" + productId
                + "&warehouseId=" + warehouseId + "&currentQty=" + currentQty;
        try {
            restTemplate.postForEntity(url, null, Void.class);
        } catch (Exception ex) {
            log.warn("Overstock alert dispatch failed for product {} warehouse {}: {}",
                    productId, warehouseId, ex.getMessage());
        }
    }
}
