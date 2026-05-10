package com.stockpro.report.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.stockpro.report.entity.InventorySnapshot;
import com.stockpro.report.repository.ReportRepository;
import com.stockpro.report.service.ReportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final RestTemplate restTemplate;

    @Value("${services.warehouse.url}")
    private String warehouseServiceUrl;

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

    @Value("${services.purchase.url}")
    private String purchaseServiceUrl;

    @Override
    public InventorySnapshot takeSnapshot(int warehouseId, int productId) {
        try {
            // Fetch current stock from warehouse-service
            String stockUrl = String.format("%s/warehouses/%d/stock/%d", warehouseServiceUrl, warehouseId, productId);
            Map<String, Object> stockResponse = restTemplate.getForObject(stockUrl, Map.class);
            int quantity = 0;
            if (stockResponse != null && stockResponse.get("data") != null) {
                Map<String, Object> data = (Map<String, Object>) stockResponse.get("data");
                quantity = (int) data.get("quantity");
            }

            // Fetch cost price from product-service
            String productUrl = String.format("%s/products/%d", productServiceUrl, productId);
            Map<String, Object> productResponse = restTemplate.getForObject(productUrl, Map.class);
            double costPrice = 0;
            if (productResponse != null && productResponse.get("data") != null) {
                Map<String, Object> data = (Map<String, Object>) productResponse.get("data");
                costPrice = ((Number) data.get("costPrice")).doubleValue();
            }

            InventorySnapshot snapshot = InventorySnapshot.builder()
                    .warehouseId(warehouseId)
                    .productId(productId)
                    .quantity(quantity)
                    .stockValue(quantity * costPrice)
                    .snapshotDate(LocalDate.now())
                    .build();

            return reportRepository.save(snapshot);
        } catch (Exception e) {
            log.error("Failed to take snapshot for warehouse {} and product {}: {}", warehouseId, productId, e.getMessage());
            return null;
        }
    }

    @Override
    public Double getTotalStockValue() {
        log.info("Calculating real-time total stock value");
        try {
            String url = productServiceUrl + "/products";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> products = (List<Map<String, Object>>) response.get("data");
                return products.stream()
                        .mapToDouble(p -> {
                            Object qtyObj = p.get("currentQuantity");
                            Object priceObj = p.get("costPrice");
                            double qty = qtyObj != null ? ((Number) qtyObj).doubleValue() : 0.0;
                            double price = priceObj != null ? ((Number) priceObj).doubleValue() : 0.0;
                            return qty * price;
                        })
                        .sum();
            }
        } catch (Exception e) {
            log.error("Error calculating real-time valuation: {}", e.getMessage());
        }
        
        // Fallback to snapshot if real-time fails
        return reportRepository.findAll().stream()
                .filter(s -> s.getSnapshotDate().equals(LocalDate.now()))
                .mapToDouble(InventorySnapshot::getStockValue)
                .sum();
    }

    @Override
    public List<InventorySnapshot> getValuationDetails() {
        log.info("Fetching real-time detailed valuation report");
        try {
            String url = productServiceUrl + "/products";
            HttpEntity<Void> entity = new HttpEntity<>(getInternalHeaders());
            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> products = (List<Map<String, Object>>) response.get("data");
                return products.stream()
                        .map(p -> InventorySnapshot.builder()
                                .productId(((Number) p.get("productId")).intValue())
                                .productName((String) p.get("name"))
                                .quantity(((Number) p.get("currentQuantity")).intValue())
                                .stockValue(((Number) p.get("currentQuantity")).doubleValue() * ((Number) p.get("costPrice")).doubleValue())
                                .snapshotDate(LocalDate.now())
                                .warehouseId(0) // Global
                                .build())
                        .collect(java.util.stream.Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Error fetching detailed valuation: {}", e.getMessage());
        }
        return reportRepository.findAll().stream()
                .filter(s -> s.getSnapshotDate().equals(LocalDate.now()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public Double getStockValueByWarehouse(int warehouseId) {
        Double value = reportRepository.sumStockValueByWarehouse(warehouseId);
        return value != null ? value : 0.0;
    }

    @Override
    public Double getInventoryTurnover(int productId, LocalDate start, LocalDate end) {
        // Simplified turnover calculation
        // Typically COGS / Average Inventory
        return 0.0; 
    }

    @Override
    public List<InventorySnapshot> getLowStockReport() {
        log.info("Fetching real-time low stock report");
        try {
            String url = productServiceUrl + "/products/low-stock";
            HttpEntity<Void> entity = new HttpEntity<>(getInternalHeaders());
            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> lowStockProducts = (List<Map<String, Object>>) response.get("data");
                return lowStockProducts.stream()
                        .map(p -> InventorySnapshot.builder()
                                .productId(((Number) p.get("productId")).intValue())
                                .productName((String) p.get("name"))
                                .quantity(((Number) p.get("currentQuantity")).intValue())
                                .stockValue(((Number) p.get("currentQuantity")).doubleValue() * ((Number) p.get("costPrice")).doubleValue())
                                .snapshotDate(LocalDate.now())
                                .warehouseId(0) // Global
                                .build())
                        .collect(java.util.stream.Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Error fetching real-time low stock: {}", e.getMessage());
        }
        return reportRepository.findLowStockSnapshot(10); // Fallback
    }

    @Override
    public Map<String, Integer> getStockMovementSummary(int warehouseId) {
        log.info("Fetching movement summary for warehouse {}", warehouseId);
        try {
            // This would ideally sum movements from movement-service grouped by type
            Map<String, Integer> summary = new HashMap<>();
            summary.put("STOCK_IN", 0);
            summary.put("STOCK_OUT", 0);
            summary.put("TRANSFER_IN", 0);
            summary.put("TRANSFER_OUT", 0);
            return summary;
        } catch (Exception e) {
            log.error("Error fetching movement summary: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    @Override
    public List<Integer> getTopMovingProducts(int limit) {
        log.info("Fetching top moving products (limit: {})", limit);
        try {
            String url = movementServiceUrl + "/movements";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> movements = (List<Map<String, Object>>) response.get("data");
                return movements.stream()
                        .filter(m -> "STOCK_OUT".equals(m.get("movementType")) || "TRANSFER_OUT".equals(m.get("movementType")))
                        .collect(java.util.stream.Collectors.groupingBy(
                                m -> (Integer) m.get("productId"), 
                                java.util.stream.Collectors.summingInt(m -> (Integer) m.get("quantity"))
                        ))
                        .entrySet().stream()
                        .sorted(java.util.Map.Entry.<Integer, Integer>comparingByValue().reversed())
                        .limit(limit)
                        .map(java.util.Map.Entry::getKey)
                        .collect(java.util.stream.Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Error calculating top moving products: {}", e.getMessage());
        }
        return List.of(); 
    }

    @Override
    public List<Integer> getSlowMovingProducts(int limit) {
        log.info("Fetching slow moving products (limit: {})", limit);
        try {
            String url = movementServiceUrl + "/movements";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> movements = (List<Map<String, Object>>) response.get("data");
                return movements.stream()
                        .filter(m -> "STOCK_OUT".equals(m.get("movementType")))
                        .collect(java.util.stream.Collectors.groupingBy(
                                m -> (Integer) m.get("productId"), 
                                java.util.stream.Collectors.summingInt(m -> (Integer) m.get("quantity"))
                        ))
                        .entrySet().stream()
                        .sorted(java.util.Map.Entry.comparingByValue())
                        .limit(limit)
                        .map(java.util.Map.Entry::getKey)
                        .collect(java.util.stream.Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Error calculating slow moving products: {}", e.getMessage());
        }
        return List.of();
    }

    @Override
    public Map<String, Object> getPOSummary(LocalDate start, LocalDate end) {
        log.info("Fetching PO summary from {} to {}", start, end);
        try {
            String url = String.format("%s/purchase-orders/date-range?start=%s&end=%s", 
                    purchaseServiceUrl, start, end);
            HttpEntity<Void> entity = new HttpEntity<>(getInternalHeaders());
            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> pos = (List<Map<String, Object>>) response.get("data");
                
                // Only count APPROVED or RECEIVED status as "Spend"
                List<String> approvedStatuses = List.of("APPROVED", "PARTIALLY_RECEIVED", "FULLY_RECEIVED");
                
                double approvedTotal = pos.stream()
                        .filter(po -> approvedStatuses.contains(po.get("status")))
                        .mapToDouble(po -> {
                            Object amt = po.get("totalAmount");
                            return amt != null ? ((Number) amt).doubleValue() : 0.0;
                        })
                        .sum();

                Map<String, Object> summary = new HashMap<>();
                summary.put("totalOrders", pos.size());
                summary.put("totalAmount", approvedTotal); // Use only approved/committed amount
                summary.put("orders", pos);
                return summary;
            }
        } catch (Exception e) {
            log.error("Error fetching PO summary: {}", e.getMessage());
        }
        return new HashMap<>();
    }

    @Override
    public List<Integer> getDeadStock() {
        log.info("Identifying dead stock (no movement in recent logs)");
        try {
            // Products in movement logs but not in STOCK_OUT for a long time
            // For now, return any products that have 0 total movement
            String url = movementServiceUrl + "/movements";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> movements = (List<Map<String, Object>>) response.get("data");
                if (movements.isEmpty()) return List.of();
            }
        } catch (Exception e) {
            log.error("Error calculating dead stock: {}", e.getMessage());
        }
        return List.of();
    }
    @Override
    public void runSync() {
        log.info("Starting manual inventory synchronization...");
        try {
            String warehousesUrl = warehouseServiceUrl + "/warehouses";
            Map<String, Object> warehousesResponse = restTemplate.getForObject(warehousesUrl, Map.class);
            
            if (warehousesResponse != null && warehousesResponse.get("data") != null) {
                List<Map<String, Object>> warehouses = (List<Map<String, Object>>) warehousesResponse.get("data");
                
                String productsUrl = productServiceUrl + "/products";
                Map<String, Object> productsResponse = restTemplate.getForObject(productsUrl, Map.class);
                
                if (productsResponse != null && productsResponse.get("data") != null) {
                    List<Map<String, Object>> products = (List<Map<String, Object>>) productsResponse.get("data");
                    
                    for (Map<String, Object> warehouse : warehouses) {
                        int warehouseId = (int) warehouse.get("warehouseId");
                        for (Map<String, Object> product : products) {
                            int productId = (int) product.get("productId");
                            takeSnapshot(warehouseId, productId);
                        }
                    }
                }
            }
            log.info("Manual synchronization completed.");
        } catch (Exception e) {
            log.error("Error during manual synchronization: {}", e.getMessage());
        }
    }
}
