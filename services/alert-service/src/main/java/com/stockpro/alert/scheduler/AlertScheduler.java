package com.stockpro.alert.scheduler;

import com.stockpro.alert.common.response.ApiResponse;
import com.stockpro.alert.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * AlertScheduler — Periodically scans other services for conditions that require alerts.
 * 
 * <p>Uses the standardized ApiResponse and RestTemplate with ParameterizedTypeReference
 * to ensure type safety and consistent communication between microservices.
 */
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
            
            // Use ParameterizedTypeReference to safely handle the generic ApiResponse<List<Map<String, Object>>>
            ResponseEntity<ApiResponse<List<Map<String, Object>>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<ApiResponse<List<Map<String, Object>>>>() {}
            );
            
            ApiResponse<List<Map<String, Object>>> apiResponse = response.getBody();
            
            if (apiResponse != null && apiResponse.getData() != null) {
                List<Map<String, Object>> lowStockItems = apiResponse.getData();
                log.info("Found {} low stock items", lowStockItems.size());
                
                for (Map<String, Object> item : lowStockItems) {
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
            
            // Use ParameterizedTypeReference for type safety
            ResponseEntity<ApiResponse<List<Map<String, Object>>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<ApiResponse<List<Map<String, Object>>>>() {}
            );
            
            ApiResponse<List<Map<String, Object>>> apiResponse = response.getBody();
            
            if (apiResponse != null && apiResponse.getData() != null) {
                List<Map<String, Object>> pos = apiResponse.getData();
                LocalDate today = LocalDate.now();
                
                for (Map<String, Object> po : pos) {
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
