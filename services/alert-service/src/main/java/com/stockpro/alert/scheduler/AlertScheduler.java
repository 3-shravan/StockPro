package com.stockpro.alert.scheduler;

import com.stockpro.alert.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AlertScheduler {

    private final AlertService alertService;
    private final RestTemplate restTemplate;

    @Value("${services.warehouse.url}")
    private String warehouseServiceUrl;

    @Value("${services.purchase.url}")
    private String purchaseServiceUrl;

    /**
     * Low-stock scan every 15 minutes.
     * Hits warehouse-service to find items below threshold.
     */
    @Scheduled(cron = "0 0/15 * * * *")
    public void scanLowStock() {
        log.info("Starting scheduled low-stock scan...");
        try {
            String url = warehouseServiceUrl + "/api/v1/stock/low-stock";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getBody() != null && response.getBody().get("data") != null) {
                List<Map> lowStockItems = (List<Map>) response.getBody().get("data");
                log.info("Found {} low stock items", lowStockItems.size());
                
                for (Map item : lowStockItems) {
                    int productId = (Integer) item.get("productId");
                    int warehouseId = (Integer) item.get("warehouseId");
                    int quantity = (Integer) item.get("quantity");
                    alertService.sendLowStockAlert(productId, warehouseId, quantity);
                }
            }
        } catch (Exception e) {
            log.error("Error during scheduled low-stock scan: {}", e.getMessage());
        }
    }

    /**
     * Overdue PO check daily at 09:00.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void checkOverduePOs() {
        log.info("Starting scheduled overdue PO check...");
        try {
            // Get all approved POs
            String url = purchaseServiceUrl + "/api/v1/purchase-orders/status/APPROVED";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getBody() != null && response.getBody().get("data") != null) {
                List<Map> pos = (List<Map>) response.getBody().get("data");
                LocalDate today = LocalDate.now();
                
                for (Map po : pos) {
                    String expectedDateStr = (String) po.get("expectedDate");
                    if (expectedDateStr != null) {
                        LocalDate expectedDate = LocalDate.parse(expectedDateStr);
                        if (expectedDate.isBefore(today)) {
                            int poId = (Integer) po.get("poId");
                            int supplierId = (Integer) po.get("supplierId");
                            String ref = (String) po.get("referenceNumber");
                            alertService.sendOverduePoAlert(poId, supplierId, ref);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error during scheduled overdue PO check: {}", e.getMessage());
        }
    }
}
