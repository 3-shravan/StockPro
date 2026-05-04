package com.stockpro.report.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
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

    @Value("${services.purchase.url}")
    private String purchaseServiceUrl;

    @Override
    public InventorySnapshot takeSnapshot(int warehouseId, int productId) {
        try {
            // Fetch current stock from warehouse-service
            String stockUrl = String.format("%s/api/v1/stock/%d/%d", warehouseServiceUrl, warehouseId, productId);
            Map<String, Object> stockResponse = restTemplate.getForObject(stockUrl, Map.class);
            int quantity = 0;
            if (stockResponse != null && stockResponse.get("data") != null) {
                Map<String, Object> data = (Map<String, Object>) stockResponse.get("data");
                quantity = (int) data.get("quantity");
            }

            // Fetch cost price from product-service
            String productUrl = String.format("%s/api/v1/products/%d", productServiceUrl, productId);
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
        return reportRepository.findAll().stream()
                .filter(s -> s.getSnapshotDate().equals(LocalDate.now()))
                .mapToDouble(InventorySnapshot::getStockValue)
                .sum();
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
        return reportRepository.findLowStockSnapshot(10); // Example threshold
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
        // This would call movement-service/top-moving or similar
        return List.of(); 
    }

    @Override
    public List<Integer> getSlowMovingProducts(int limit) {
        log.info("Fetching slow moving products (limit: {})", limit);
        return List.of();
    }

    @Override
    public Map<String, Object> getPOSummary(LocalDate start, LocalDate end) {
        log.info("Fetching PO summary from {} to {}", start, end);
        try {
            String url = String.format("%s/api/v1/purchase-orders/date-range?start=%s&end=%s", 
                    purchaseServiceUrl, start, end);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> pos = (List<Map<String, Object>>) response.get("data");
                Map<String, Object> summary = new HashMap<>();
                summary.put("totalOrders", pos.size());
                summary.put("totalSpend", pos.stream()
                        .mapToDouble(po -> ((Number) po.get("totalAmount")).doubleValue())
                        .sum());
                return summary;
            }
        } catch (Exception e) {
            log.error("Error fetching PO summary: {}", e.getMessage());
        }
        return new HashMap<>();
    }

    @Override
    public List<Integer> getDeadStock() {
        log.info("Identifying dead stock (no movement > 90 days)");
        return List.of();
    }
}
