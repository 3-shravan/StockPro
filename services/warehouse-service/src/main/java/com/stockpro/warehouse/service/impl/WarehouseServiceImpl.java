package com.stockpro.warehouse.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.stockpro.warehouse.dto.request.StockUpdateRequest;
import com.stockpro.warehouse.dto.request.WarehouseRequest;
import com.stockpro.warehouse.dto.response.StockLevelResponse;
import com.stockpro.warehouse.dto.response.WarehouseResponse;
import com.stockpro.warehouse.dto.response.WarehouseStatsResponse;
import com.stockpro.warehouse.dto.response.WarehouseStatsResponse.ProductStockStat;
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

    @Value("${services.product.url}")
    private String productServiceUrl;

    @Value("${services.movement.url}")
    private String movementServiceUrl;

    private static final String GATEWAY_SECRET = "StockProGateway2024";

    private HttpHeaders getInternalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Gateway-Secret", GATEWAY_SECRET);
        headers.set("X-User-Name", "system");
        headers.set("X-User-Roles", "ADMIN");
        return headers;
    }

    @Override
    @Transactional
    public WarehouseResponse createWarehouse(WarehouseRequest request) {
        log.info("Creating new warehouse: {}", request.getName());
        Warehouse warehouse = warehouseMapper.toEntity(request);
        Warehouse saved = warehouseRepository.save(warehouse);
        return warehouseMapper.toResponse(saved);
    }

    @Override
    public List<WarehouseResponse> getAllWarehouses(boolean includeInactive) {
        log.debug("Service: Fetching all warehouses (includeInactive={})", includeInactive);
        List<Warehouse> warehouses;
        if (includeInactive) {
            warehouses = warehouseRepository.findAll();
        } else {
            warehouses = warehouseRepository.findByActive(true);
        }

        // Real-time capacity synchronization
        Map<Integer, Integer> capacityMap = stockLevelRepository.sumQuantitiesByWarehouse().stream()
                .collect(Collectors.toMap(
                    row -> (Integer) row[0],
                    row -> row[1] != null ? ((Number) row[1]).intValue() : 0,
                    (v1, v2) -> v1
                ));

        return warehouses.stream()
                .map(warehouse -> {
                    int realCapacity = capacityMap.getOrDefault(warehouse.getWarehouseId(), 0);
                    // Update entity if mismatch found (auto-heal)
                    if (warehouse.getUsedCapacity() != realCapacity) {
                        warehouse.setUsedCapacity(realCapacity);
                        warehouseRepository.save(warehouse);
                    }
                    return warehouseMapper.toResponse(warehouse);
                })
                .collect(Collectors.toList());
    }

    @Override
    public Optional<WarehouseResponse> getWarehouseById(int id) {
        log.debug("Service: Fetching warehouse ID: {}", id);
        return warehouseRepository.findByWarehouseId(id)
                .map(warehouseMapper::toResponse);
    }

    @Override
    @Transactional
    public WarehouseResponse updateWarehouse(int warehouseId, WarehouseRequest request) {
        log.info("Updating warehouse ID: {}", warehouseId);
        Warehouse warehouse = warehouseRepository.findByWarehouseId(warehouseId)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));

        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Integer currentUserId = 0;
        if (auth.getDetails() instanceof java.util.Map) {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> details = (java.util.Map<String, Object>) auth.getDetails();
            Object userIdObj = details.get("userId");
            if (userIdObj instanceof Integer) {
                currentUserId = (Integer) userIdObj;
            }
        }

        if (!isAdmin && (warehouse.getManagerId() == null || !warehouse.getManagerId().equals(currentUserId))) {
            throw new CustomException("Access Denied: You are not the assigned manager for this warehouse.", HttpStatus.FORBIDDEN);
        }

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
    @Transactional
    public void activateWarehouse(int warehouseId) {
        log.info("Activating warehouse ID: {}", warehouseId);
        Warehouse warehouse = warehouseRepository.findByWarehouseId(warehouseId)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));

        if (warehouse.isActive()) {
            throw new CustomException("Warehouse is already active", HttpStatus.BAD_REQUEST);
        }

        warehouse.setActive(true);
        warehouseRepository.save(warehouse);
    }

    @Override
    @Transactional
    public void deleteWarehouse(int warehouseId) {
        log.info("Hard deleting warehouse ID: {}", warehouseId);
        Warehouse warehouse = warehouseRepository.findByWarehouseId(warehouseId)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));

        stockLevelRepository.deleteByWarehouseId(warehouseId);
        warehouseRepository.delete(warehouse);
    }

    @Override
    public List<WarehouseResponse> getWarehousesByManager(int managerId) {
        log.debug("Service: Fetching warehouses for manager ID: {}", managerId);
        return warehouseRepository.findByManagerId(managerId).stream()
                .map(warehouseMapper::toResponse)
                .collect(Collectors.toList());
    }

    // --- Stock Methods ---

    @Override
    public Optional<StockLevelResponse> getStockLevel(int warehouseId, int productId) {
        log.debug("Service: Fetching stock level for warehouse {} product {}", warehouseId, productId);
        return stockLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .map(stockMapper::toResponse);
    }

    @Override
    public List<StockLevelResponse> getStockLevelsByProductId(int productId) {
        log.debug("Service: Fetching all stock levels for product {}", productId);
        return stockLevelRepository.findByProductId(productId).stream()
                .map(stockMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateStock(int warehouseId, int productId, int quantity) {
        updateStock(StockUpdateRequest.builder()
                .warehouseId(warehouseId)
                .productId(productId)
                .quantity(quantity)
                .build());
    }

    @Override
    @Transactional
    public void updateStock(com.stockpro.warehouse.dto.request.StockUpdateRequest request) {
        log.info("Service: Updating stock for warehouse {} product {} to {}", 
                request.getWarehouseId(), request.getProductId(), request.getQuantity());
        StockLevel stockLevel = getOrCreateStockLevel(request.getWarehouseId(), request.getProductId());
        int oldQty = stockLevel.getQuantity();
        stockLevel.setQuantity(request.getQuantity());
        stockLevel.setLastUpdated(LocalDateTime.now());
        StockLevel saved = stockLevelRepository.save(stockLevel);
        
        updateWarehouseUsedCapacity(request.getWarehouseId());
        recordMovement(request.getWarehouseId(), request.getProductId(), request.getQuantity() - oldQty, 
                "ADJUSTMENT", saved.getQuantity(), request);
        evaluateAndDispatchStockAlerts(saved);
    }

    @Override
    @Transactional
    public void adjustStock(int warehouseId, int productId, int delta) {
        adjustStock(StockUpdateRequest.builder()
                .warehouseId(warehouseId)
                .productId(productId)
                .quantity(delta)
                .build());
    }

    @Override
    @Transactional
    public void adjustStock(com.stockpro.warehouse.dto.request.StockUpdateRequest request) {
        log.info("Service: Adjusting stock for warehouse {} product {} by {}", 
                request.getWarehouseId(), request.getProductId(), request.getQuantity());
        StockLevel stockLevel = getOrCreateStockLevel(request.getWarehouseId(), request.getProductId());
        stockLevel.setQuantity(stockLevel.getQuantity() + request.getQuantity());
        stockLevel.setLastUpdated(LocalDateTime.now());
        StockLevel saved = stockLevelRepository.save(stockLevel);
        
        updateWarehouseUsedCapacity(request.getWarehouseId());
        recordMovement(request.getWarehouseId(), request.getProductId(), request.getQuantity(), 
                request.getQuantity() > 0 ? "STOCK_IN" : "STOCK_OUT", saved.getQuantity(), request);
        evaluateAndDispatchStockAlerts(saved);
    }

    private StockLevel getOrCreateStockLevel(int warehouseId, int productId) {
        // Why: Ensure the warehouse actually exists to prevent database FK constraint violations.
        if (!warehouseRepository.existsById(warehouseId)) {
            throw new CustomException("Cannot adjust stock: Warehouse ID " + warehouseId + " does not exist.", HttpStatus.NOT_FOUND);
        }

        return stockLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseGet(() -> {
                    StockLevel s = new StockLevel();
                    s.setWarehouseId(warehouseId);
                    s.setProductId(productId);
                    s.setQuantity(0);
                    s.setReservedQuantity(0);
                    s.setLastUpdated(LocalDateTime.now());
                    return s;
                });
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
        stockLevelRepository.save(stockLevel);
    }

    @Override
    @Transactional
    public void releaseStock(int warehouseId, int productId, int quantity) {
        log.info("Releasing {} units for warehouse {} product {}", quantity, warehouseId, productId);
        StockLevel stockLevel = stockLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseThrow(() -> new CustomException("Stock level not found for product in this warehouse",
                        HttpStatus.NOT_FOUND));

        int newReserved = Math.max(0, stockLevel.getReservedQuantity() - quantity);
        stockLevel.setReservedQuantity(newReserved);
        stockLevelRepository.save(stockLevel);
    }

    @Override
    @Transactional
    public void transferStock(int fromWarehouseId, int toWarehouseId, int productId, int quantity) {
        log.info("Transferring {} units from {} to {} for product {}", quantity, fromWarehouseId, toWarehouseId, productId);

        StockLevel sourceStock = stockLevelRepository.findByWarehouseIdAndProductId(fromWarehouseId, productId)
                .orElseThrow(() -> new CustomException("Source stock level not found", HttpStatus.NOT_FOUND));

        if (sourceStock.getQuantity() < quantity) {
            throw new CustomException("Insufficient stock in source warehouse", HttpStatus.BAD_REQUEST);
        }

        sourceStock.setQuantity(sourceStock.getQuantity() - quantity);
        sourceStock.setLastUpdated(LocalDateTime.now());

        StockLevel destStock = stockLevelRepository.findByWarehouseIdAndProductId(toWarehouseId, productId)
                .orElseGet(() -> {
                    StockLevel s = new StockLevel();
                    s.setWarehouseId(toWarehouseId);
                    s.setProductId(productId);
                    s.setQuantity(0);
                    s.setReservedQuantity(0);
                    s.setLastUpdated(LocalDateTime.now());
                    return s;
                });

        destStock.setQuantity(destStock.getQuantity() + quantity);
        destStock.setLastUpdated(LocalDateTime.now());

        StockLevel savedSource = stockLevelRepository.save(sourceStock);
        StockLevel savedDestination = stockLevelRepository.save(destStock);

        updateWarehouseUsedCapacity(fromWarehouseId);
        updateWarehouseUsedCapacity(toWarehouseId);

        recordMovement(fromWarehouseId, productId, -quantity, "TRANSFER_OUT", savedSource.getQuantity(), null);
        recordMovement(toWarehouseId, productId, quantity, "TRANSFER_IN", savedDestination.getQuantity(), null);

        evaluateAndDispatchStockAlerts(savedSource);
        evaluateAndDispatchStockAlerts(savedDestination);
    }

    @Override
    public List<StockLevelResponse> getLowStockItems(int warehouseId) {
        log.debug("Service: Fetching low stock items for warehouse ID: {}", warehouseId);
        return stockLevelRepository.findLowStockByWarehouse(warehouseId, lowStockThreshold).stream()
                .map(stockMapper::toResponse)
                .collect(Collectors.toList());
    }

    private void evaluateAndDispatchStockAlerts(StockLevel stockLevel) {
        int availableQty = stockLevel.getAvailableQuantity();

        if (availableQty < lowStockThreshold) {
            dispatchLowStockAlert(stockLevel.getProductId(), stockLevel.getWarehouseId(), availableQty);
        } else if (availableQty > overstockThreshold) {
            dispatchOverstockAlert(stockLevel.getProductId(), stockLevel.getWarehouseId(), availableQty);
        }
    }

    private void dispatchLowStockAlert(int productId, int warehouseId, int currentQty) {
        try {
            String url = alertServiceUrl + "/alerts/low-stock?productId=" + productId
                    + "&warehouseId=" + warehouseId + "&currentQty=" + currentQty;
            restTemplate.postForEntity(url, null, Void.class);
        } catch (Exception e) {
            log.error("Failed to dispatch low stock alert: {}", e.getMessage());
        }
    }

    private void dispatchOverstockAlert(int productId, int warehouseId, int currentQty) {
        try {
            String url = alertServiceUrl + "/alerts/overstock?productId=" + productId
                    + "&warehouseId=" + warehouseId + "&currentQty=" + currentQty;
            restTemplate.postForEntity(url, null, Void.class);
        } catch (Exception e) {
            log.error("Failed to dispatch overstock alert: {}", e.getMessage());
        }
    }

    @Override
    public WarehouseStatsResponse getWarehouseStats(int warehouseId) {
        log.info("Generating statistics for warehouse ID: {}", warehouseId);
        Warehouse warehouse = warehouseRepository.findByWarehouseId(warehouseId)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));

        int totalItems = stockLevelRepository.sumQuantityByWarehouseId(warehouseId);
        int uniqueProducts = stockLevelRepository.countUniqueProductsByWarehouseId(warehouseId);
        List<StockLevel> topStock = stockLevelRepository.findTopProductsByWarehouseId(warehouseId, 5);
        List<StockLevel> lowStock = stockLevelRepository.findLowStockByWarehouse(warehouseId, lowStockThreshold);

        List<ProductStockStat> topProducts = topStock.stream()
                .map(s -> ProductStockStat.builder()
                        .productId(s.getProductId())
                        .productName(getProductName(s.getProductId()))
                        .quantity(s.getQuantity())
                        .build())
                .collect(Collectors.toList());

        double utilizedPercentage = warehouse.getCapacity() > 0 
                ? (double) totalItems / warehouse.getCapacity() * 100 
                : 0;

        return WarehouseStatsResponse.builder()
                .warehouseId(warehouseId)
                .warehouseName(warehouse.getName())
                .totalItems(totalItems)
                .uniqueProducts(uniqueProducts)
                .capacity(warehouse.getCapacity())
                .usedCapacity(totalItems) // Use real-time totalItems instead of cached field
                .utilizedPercentage(Math.round(utilizedPercentage * 100.0) / 100.0)
                .lowStockItems(lowStock.size())
                .topProducts(topProducts)
                .build();
    }

    @Override
    @Transactional
    public void reconcileWarehouseCapacity(int warehouseId) {
        log.info("Reconciling capacity for warehouse ID: {}", warehouseId);
        updateWarehouseUsedCapacity(warehouseId);
    }

    private String getProductName(int productId) {
        try {
            String url = productServiceUrl + "/products/" + productId;
            // Using a simple Map response to avoid creating another DTO for product
            HttpEntity<Void> entity = new HttpEntity<>(getInternalHeaders());
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                entity, 
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getBody() != null && response.getBody().get("data") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                return (String) data.get("name");
            }
        } catch (Exception e) {
            log.warn("Could not fetch product name for ID {}: {}", productId, e.getMessage());
        }
        return "Unknown Product (#" + productId + ")";
    }

    private void updateWarehouseUsedCapacity(int warehouseId) {
        int totalQuantity = stockLevelRepository.sumQuantityByWarehouseId(warehouseId);
        Warehouse warehouse = warehouseRepository.findByWarehouseId(warehouseId)
                .orElseThrow(() -> new CustomException("Warehouse not found", HttpStatus.NOT_FOUND));
        warehouse.setUsedCapacity(totalQuantity);
        warehouseRepository.save(warehouse);
    }

    private void recordMovement(int warehouseId, int productId, int quantity, String type, int balanceAfter, StockUpdateRequest context) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("productId", productId);
            request.put("warehouseId", warehouseId);
            request.put("movementType", type);
            request.put("quantity", Math.abs(quantity));
            
            // Prioritize context metadata if available
            int refId = (context != null && context.getReferenceId() != null) ? context.getReferenceId() : 0;
            String refType = (context != null && context.getReferenceType() != null) ? context.getReferenceType() : "SYSTEM";
            String notes = (context != null && context.getNotes() != null) ? context.getNotes() : "Automated stock adjustment";

            request.put("referenceId", refId);
            request.put("referenceType", refType);
            request.put("unitCost", 0.0);
            request.put("performedBy", 1); // System
            request.put("balanceAfter", balanceAfter);
            request.put("notes", notes);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, getInternalHeaders());
            restTemplate.postForEntity(movementServiceUrl + "/movements", entity, Void.class);
        } catch (Exception e) {
            log.error("Failed to record movement: {}", e.getMessage());
        }
    }
}
