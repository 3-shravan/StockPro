package com.stockpro.report.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReportScheduler {

    private final ReportService reportService;
    private final RestTemplate restTemplate;

    @Value("${services.warehouse.url}")
    private String warehouseServiceUrl;

    @Value("${services.product.url}")
    private String productServiceUrl;

    @Scheduled(cron = "0 0 0 * * *") // Midnight
    public void runDailySnapshots() {
        log.info("Starting scheduled daily inventory snapshots...");
        try {
            // Get all active warehouses
            String warehousesUrl = warehouseServiceUrl + "/api/v1/warehouses";
            Map<String, Object> warehousesResponse = restTemplate.getForObject(warehousesUrl, Map.class);
            
            if (warehousesResponse != null && warehousesResponse.get("data") != null) {
                List<Map<String, Object>> warehouses = (List<Map<String, Object>>) warehousesResponse.get("data");
                
                // Get all active products
                String productsUrl = productServiceUrl + "/api/v1/products";
                Map<String, Object> productsResponse = restTemplate.getForObject(productsUrl, Map.class);
                
                if (productsResponse != null && productsResponse.get("data") != null) {
                    List<Map<String, Object>> products = (List<Map<String, Object>>) productsResponse.get("data");
                    
                    for (Map<String, Object> warehouse : warehouses) {
                        int warehouseId = (int) warehouse.get("warehouseId");
                        for (Map<String, Object> product : products) {
                            int productId = (int) product.get("productId");
                            reportService.takeSnapshot(warehouseId, productId);
                        }
                    }
                }
            }
            log.info("Finished scheduled daily inventory snapshots.");
        } catch (Exception e) {
            log.error("Error during scheduled daily snapshots: {}", e.getMessage());
        }
    }
}
