package com.stockpro.report.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
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
    public List<InventorySnapshot> getValuationDetailsByWarehouse(int warehouseId) {
        log.info("Fetching real-time detailed valuation for warehouse: {}", warehouseId);
        try {
            // 1. Fetch all stock for this warehouse
            String stockUrl = warehouseServiceUrl + "/warehouses/" + warehouseId + "/stock";
            Map<String, Object> stockResponse = restTemplate.getForObject(stockUrl, Map.class);
            
            if (stockResponse != null && stockResponse.get("data") != null) {
                List<Map<String, Object>> stockItems = (List<Map<String, Object>>) stockResponse.get("data");
                if (stockItems.isEmpty()) return List.of();

                // 2. Fetch all products to get names and prices
                String productUrl = productServiceUrl + "/products";
                Map<String, Object> productResponse = restTemplate.getForObject(productUrl, Map.class);
                
                if (productResponse != null && productResponse.get("data") != null) {
                    List<Map<String, Object>> allProducts = (List<Map<String, Object>>) productResponse.get("data");
                    Map<Integer, Map<String, Object>> productMap = allProducts.stream()
                        .collect(java.util.stream.Collectors.toMap(
                            p -> ((Number) p.get("productId")).intValue(),
                            p -> p
                        ));

                    // 3. Construct snapshots
                    return stockItems.stream()
                        .map(item -> {
                            int productId = ((Number) item.get("productId")).intValue();
                            int qty = ((Number) item.get("quantity")).intValue();
                            Map<String, Object> pInfo = productMap.get(productId);
                            
                            double price = 0.0;
                            String name = "Undefined Item";
                            if (pInfo != null) {
                                price = ((Number) pInfo.get("costPrice")).doubleValue();
                                name = (String) pInfo.get("name");
                            }
                            
                            return InventorySnapshot.builder()
                                .productId(productId)
                                .productName(name)
                                .warehouseId(warehouseId)
                                .quantity(qty)
                                .stockValue(qty * price)
                                .snapshotDate(LocalDate.now())
                                .build();
                        })
                        .collect(java.util.stream.Collectors.toList());
                }
            }
        } catch (Exception e) {
            log.error("Error fetching detailed warehouse valuation for {}: {}", warehouseId, e.getMessage());
        }

        return reportRepository.findAll().stream()
                .filter(s -> s.getWarehouseId() == warehouseId && s.getSnapshotDate().equals(LocalDate.now()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public Double getStockValueByWarehouse(int warehouseId) {
        log.info("Calculating real-time stock value for warehouse: {}", warehouseId);
        try {
            // 1. Fetch all stock for this warehouse
            String stockUrl = warehouseServiceUrl + "/warehouses/" + warehouseId + "/stock";
            Map<String, Object> stockResponse = restTemplate.getForObject(stockUrl, Map.class);
            
            if (stockResponse != null && stockResponse.get("data") != null) {
                List<Map<String, Object>> stockItems = (List<Map<String, Object>>) stockResponse.get("data");
                if (stockItems.isEmpty()) return 0.0;

                // 2. Fetch all products to get cost prices
                String productUrl = productServiceUrl + "/products";
                Map<String, Object> productResponse = restTemplate.getForObject(productUrl, Map.class);
                
                if (productResponse != null && productResponse.get("data") != null) {
                    List<Map<String, Object>> allProducts = (List<Map<String, Object>>) productResponse.get("data");
                    Map<Integer, Double> priceMap = allProducts.stream()
                        .collect(java.util.stream.Collectors.toMap(
                            p -> ((Number) p.get("productId")).intValue(),
                            p -> ((Number) p.get("costPrice")).doubleValue()
                        ));

                    // 3. Calculate sum
                    return stockItems.stream()
                        .mapToDouble(item -> {
                            int productId = ((Number) item.get("productId")).intValue();
                            int qty = ((Number) item.get("quantity")).intValue();
                            double price = priceMap.getOrDefault(productId, 0.0);
                            return qty * price;
                        })
                        .sum();
                }
            }
        } catch (Exception e) {
            log.error("Error calculating real-time warehouse valuation for {}: {}", warehouseId, e.getMessage());
        }

        // Fallback to latest snapshot
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
        log.info("Fetching real-time low stock report using product-specific thresholds");
        java.util.ArrayList<InventorySnapshot> allLowStock = new java.util.ArrayList<>();
        try {
            // 1. Fetch all warehouses to iterate
            String whUrl = warehouseServiceUrl + "/warehouses";
            Map<String, Object> whRes = restTemplate.getForObject(whUrl, Map.class);
            List<Map<String, Object>> warehouses = (List<Map<String, Object>>) whRes.get("data");

            if (warehouses == null || warehouses.isEmpty()) {
                log.warn("No warehouses found during low stock report generation");
                return List.of();
            }

            // 2. Fetch all products to get names/prices AND REORDER LEVELS
            String prodUrl = productServiceUrl + "/products";
            Map<String, Object> prodRes = restTemplate.getForObject(prodUrl, Map.class);
            List<Map<String, Object>> allProducts = (List<Map<String, Object>>) prodRes.get("data");
            
            if (allProducts == null || allProducts.isEmpty()) {
                log.warn("No products found during low stock report generation");
                return List.of();
            }

            Map<Integer, Map<String, Object>> productMap = allProducts.stream()
                .collect(java.util.stream.Collectors.toMap(p -> ((Number) p.get("productId")).intValue(), p -> p));

            for (Map<String, Object> wh : warehouses) {
                int whId = ((Number) wh.get("warehouseId")).intValue();
                
                // Fetch ALL stock for this warehouse
                String stockUrl = warehouseServiceUrl + "/warehouses/" + whId + "/stock";
                Map<String, Object> stockRes = restTemplate.getForObject(stockUrl, Map.class);
                
                if (stockRes != null && stockRes.get("data") instanceof List) {
                    List<Map<String, Object>> stockItems = (List<Map<String, Object>>) stockRes.get("data");
                    
                    if (stockItems.isEmpty()) {
                        log.debug("No stock found for warehouse ID: {}", whId);
                        continue;
                    }

                    for (Map<String, Object> item : stockItems) {
                        int pId = ((Number) item.get("productId")).intValue();
                        Map<String, Object> pInfo = productMap.get(pId);
                        
                        if (pInfo != null) {
                            int currentQty = ((Number) item.get("quantity")).intValue();
                            int reorderLevel = ((Number) pInfo.get("reorderLevel")).intValue();
                            
                            // Real-time comparison using product-specific safety threshold
                            if (currentQty <= reorderLevel) {
                                allLowStock.add(InventorySnapshot.builder()
                                    .productId(pId)
                                    .productName((String) pInfo.get("name"))
                                    .quantity(currentQty)
                                    .stockValue(currentQty * ((Number) pInfo.get("costPrice")).doubleValue())
                                    .snapshotDate(LocalDate.now())
                                    .warehouseId(whId)
                                    .build());
                            }
                        } else {
                            log.warn("Product ID {} found in stock for hub {} but missing from product catalog", pId, whId);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error generating granular low stock report: {}", e.getMessage(), e);
        }
        return allLowStock;
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
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
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
    @Transactional
    public void runSync() {
        log.info("Starting Global Inventory Reconciliation...");
        try {
            // 1. Fetch all products from product-service
            String productsUrl = productServiceUrl + "/products";
            Map<String, Object> productsBody = restTemplate.getForObject(productsUrl, Map.class);
            
            if (productsBody == null || productsBody.get("data") == null) return;
            List<Map<String, Object>> products = (List<Map<String, Object>>) productsBody.get("data");

            for (Map<String, Object> product : products) {
                int productId = ((Number) product.get("productId")).intValue();
                int currentGlobalQty = ((Number) product.get("currentQuantity")).intValue();
                
                // 2. Fetch all stock levels for this product from warehouse-service
                String stockUrl = warehouseServiceUrl + "/warehouses/stock/product/" + productId;
                Map<String, Object> stockBody = restTemplate.getForObject(stockUrl, Map.class);
                
                int actualTotalQty = 0;
                if (stockBody != null && stockBody.get("data") != null) {
                    List<Map<String, Object>> stockLevels = (List<Map<String, Object>>) stockBody.get("data");
                    actualTotalQty = stockLevels.stream()
                            .mapToInt(s -> ((Number) s.get("quantity")).intValue())
                            .sum();
                }

                // 3. If there's a discrepancy, update the product-service
                if (actualTotalQty != currentGlobalQty) {
                    log.info("Discrepancy found for product {}: Global={}, Physical={}. Reconciling...", 
                            productId, currentGlobalQty, actualTotalQty);
                    
                    String updateUrl = productServiceUrl + "/products/" + productId + "/stock?quantity=" + (actualTotalQty - currentGlobalQty);
                    restTemplate.put(updateUrl, null);
                }
            }
            log.info("Global Inventory Reconciliation completed successfully.");
        } catch (Exception e) {
            log.error("Error during Global Inventory Reconciliation: {}", e.getMessage());
            throw new RuntimeException("Reconciliation failed: " + e.getMessage());
        }
    }
}
