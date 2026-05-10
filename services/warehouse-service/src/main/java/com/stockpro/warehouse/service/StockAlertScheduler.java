package com.stockpro.warehouse.service;

import com.stockpro.warehouse.entity.StockLevel;
import com.stockpro.warehouse.repository.StockLevelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockAlertScheduler {

    private final StockLevelRepository stockLevelRepository;
    private final RestTemplate restTemplate;

    @Value("${services.alert.url}")
    private String alertServiceUrl;

    @Value("${stock.alert.low-threshold:10}")
    private int lowStockThreshold;

    @Value("${stock.alert.overstock-threshold:200}")
    private int overstockThreshold;

    @Scheduled(fixedRateString = "${stock.alert.scan.fixed-rate-ms:900000}")
    public void scanAndDispatchStockAlerts() {
        dispatchLowStockAlerts();
        dispatchOverstockAlerts();
    }

    private void dispatchLowStockAlerts() {
        for (StockLevel stock : stockLevelRepository.findAllBelowAvailableThreshold(lowStockThreshold)) {
            int availableQty = stock.getAvailableQuantity();
            String url = alertServiceUrl + "/alerts/low-stock?productId=" + stock.getProductId()
                    + "&warehouseId=" + stock.getWarehouseId() + "&currentQty=" + availableQty;
            try {
                restTemplate.postForEntity(url, null, Void.class);
            } catch (Exception ex) {
                log.warn("Scheduler low-stock alert dispatch failed for product {} warehouse {}: {}",
                        stock.getProductId(), stock.getWarehouseId(), ex.getMessage());
            }
        }
    }

    private void dispatchOverstockAlerts() {
        for (StockLevel stock : stockLevelRepository.findAllAboveAvailableThreshold(overstockThreshold)) {
            int availableQty = stock.getAvailableQuantity();
            String url = alertServiceUrl + "/alerts/overstock?productId=" + stock.getProductId()
                    + "&warehouseId=" + stock.getWarehouseId() + "&currentQty=" + availableQty;
            try {
                restTemplate.postForEntity(url, null, Void.class);
            } catch (Exception ex) {
                log.warn("Scheduler overstock alert dispatch failed for product {} warehouse {}: {}",
                        stock.getProductId(), stock.getWarehouseId(), ex.getMessage());
            }
        }
    }
}
