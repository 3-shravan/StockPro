package com.stockpro.report.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.stockpro.report.entity.InventorySnapshot;
import com.stockpro.report.repository.ReportRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportServiceImpl")
class ReportServiceImplTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ReportServiceImpl reportService;

    private InventorySnapshot snapshot;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(reportService, "warehouseServiceUrl", "http://localhost:8083");
        ReflectionTestUtils.setField(reportService, "productServiceUrl", "http://localhost:8082");
        ReflectionTestUtils.setField(reportService, "movementServiceUrl", "http://localhost:8086");
        ReflectionTestUtils.setField(reportService, "purchaseServiceUrl", "http://localhost:8084");

        snapshot = InventorySnapshot.builder()
                .snapshotId(1)
                .warehouseId(5)
                .productId(10)
                .quantity(30)
                .stockValue(300.0) // 30 * 10.0
                .snapshotDate(LocalDate.now())
                .build();
    }

    @Nested
    @DisplayName("takeSnapshot()")
    class TakeSnapshot {

        @Test
        @DisplayName("fetches stock and price via REST and saves snapshot successfully")
        void success() {
            // Mock stock level lookup
            Map<String, Object> stockLevel = new HashMap<>();
            stockLevel.put("quantity", 30);
            Map<String, Object> stockBody = new HashMap<>();
            stockBody.put("data", stockLevel);
            when(restTemplate.getForObject("http://localhost:8083/warehouses/5/stock/10", Map.class))
                    .thenReturn(stockBody);

            // Mock product cost lookup
            Map<String, Object> product = new HashMap<>();
            product.put("costPrice", 10.0);
            Map<String, Object> productBody = new HashMap<>();
            productBody.put("data", product);
            when(restTemplate.getForObject("http://localhost:8082/products/10", Map.class))
                    .thenReturn(productBody);

            when(reportRepository.save(any(InventorySnapshot.class))).thenReturn(snapshot);

            InventorySnapshot result = reportService.takeSnapshot(5, 10);

            assertThat(result).isNotNull();
            assertThat(result.getStockValue()).isEqualTo(300.0);
            verify(reportRepository).save(any(InventorySnapshot.class));
        }

        @Test
        @DisplayName("returns null when stock or product REST lookup fails")
        void restFailure_returnsNull() {
            when(restTemplate.getForObject("http://localhost:8083/warehouses/5/stock/10", Map.class))
                    .thenThrow(new RuntimeException("Service down"));

            InventorySnapshot result = reportService.takeSnapshot(5, 10);

            assertThat(result).isNull();
            verify(reportRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("valuations & summaries")
    class Valuations {

        @Test
        @DisplayName("calculates real-time global total stock value successfully")
        void successRealTime() {
            List<Map<String, Object>> productsList = new ArrayList<>();
            Map<String, Object> p1 = new HashMap<>();
            p1.put("currentQuantity", 10.0);
            p1.put("costPrice", 15.0);
            productsList.add(p1);

            Map<String, Object> body = new HashMap<>();
            body.put("data", productsList);

            when(restTemplate.getForObject("http://localhost:8082/products", Map.class))
                    .thenReturn(body);

            Double result = reportService.getTotalStockValue();

            assertThat(result).isEqualTo(150.0);
        }

        @Test
        @DisplayName("falls back to repository snapshots when real-time REST lookup fails")
        void fallbackToSnapshots() {
            when(restTemplate.getForObject("http://localhost:8082/products", Map.class))
                    .thenThrow(new RuntimeException("Service down"));

            when(reportRepository.findAll()).thenReturn(List.of(snapshot));

            Double result = reportService.getTotalStockValue();

            assertThat(result).isEqualTo(300.0);
        }

        @Test
        @DisplayName("returns valuation details grouped globally")
        void getValuationDetails() {
            List<Map<String, Object>> productsList = new ArrayList<>();
            Map<String, Object> p1 = new HashMap<>();
            p1.put("productId", 10);
            p1.put("name", "Product 10");
            p1.put("currentQuantity", 20);
            p1.put("costPrice", 5.0);
            productsList.add(p1);

            Map<String, Object> body = new HashMap<>();
            body.put("data", productsList);

            when(restTemplate.getForObject("http://localhost:8082/products", Map.class))
                    .thenReturn(body);

            List<InventorySnapshot> result = reportService.getValuationDetails();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStockValue()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("calculates real-time valuation by specific warehouse successfully")
        void getValuationDetailsByWarehouse() {
            // Mock warehouse stock
            List<Map<String, Object>> stockList = new ArrayList<>();
            Map<String, Object> s1 = new HashMap<>();
            s1.put("productId", 10);
            s1.put("quantity", 50);
            stockList.add(s1);

            Map<String, Object> stockBody = new HashMap<>();
            stockBody.put("data", stockList);

            when(restTemplate.getForObject("http://localhost:8083/warehouses/5/stock", Map.class))
                    .thenReturn(stockBody);

            // Mock product costs
            List<Map<String, Object>> productsList = new ArrayList<>();
            Map<String, Object> p1 = new HashMap<>();
            p1.put("productId", 10);
            p1.put("name", "Product 10");
            p1.put("costPrice", 4.0);
            productsList.add(p1);

            Map<String, Object> productBody = new HashMap<>();
            productBody.put("data", productsList);

            when(restTemplate.getForObject("http://localhost:8082/products", Map.class))
                    .thenReturn(productBody);

            List<InventorySnapshot> result = reportService.getValuationDetailsByWarehouse(5);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStockValue()).isEqualTo(200.0);
        }

        @Test
        @DisplayName("sums stock value by specific warehouse successfully")
        void getStockValueByWarehouse() {
            List<Map<String, Object>> stockList = new ArrayList<>();
            Map<String, Object> s1 = new HashMap<>();
            s1.put("productId", 10);
            s1.put("quantity", 100);
            stockList.add(s1);

            Map<String, Object> stockBody = new HashMap<>();
            stockBody.put("data", stockList);

            when(restTemplate.getForObject("http://localhost:8083/warehouses/5/stock", Map.class))
                    .thenReturn(stockBody);

            List<Map<String, Object>> productsList = new ArrayList<>();
            Map<String, Object> p1 = new HashMap<>();
            p1.put("productId", 10);
            p1.put("costPrice", 2.5);
            productsList.add(p1);

            Map<String, Object> productBody = new HashMap<>();
            productBody.put("data", productsList);

            when(restTemplate.getForObject("http://localhost:8082/products", Map.class))
                    .thenReturn(productBody);

            Double result = reportService.getStockValueByWarehouse(5);

            assertThat(result).isEqualTo(250.0);
        }
    }

    @Nested
    @DisplayName("low stock reporting")
    class LowStockReport {

        @Test
        @DisplayName("identifies low stock items across multiple hubs based on product thresholds")
        void getLowStockReport() {
            // Mock warehouses
            List<Map<String, Object>> whList = new ArrayList<>();
            Map<String, Object> wh = new HashMap<>();
            wh.put("warehouseId", 5);
            whList.add(wh);
            Map<String, Object> whBody = new HashMap<>();
            whBody.put("data", whList);
            when(restTemplate.getForObject("http://localhost:8083/warehouses", Map.class))
                    .thenReturn(whBody);

            // Mock products
            List<Map<String, Object>> prodList = new ArrayList<>();
            Map<String, Object> prod = new HashMap<>();
            prod.put("productId", 10);
            prod.put("name", "Product 10");
            prod.put("reorderLevel", 15); // low threshold
            prod.put("costPrice", 10.0);
            prodList.add(prod);
            Map<String, Object> prodBody = new HashMap<>();
            prodBody.put("data", prodList);
            when(restTemplate.getForObject("http://localhost:8082/products", Map.class))
                    .thenReturn(prodBody);

            // Mock warehouse stocks
            List<Map<String, Object>> stockList = new ArrayList<>();
            Map<String, Object> stock = new HashMap<>();
            stock.put("productId", 10);
            stock.put("quantity", 5); // 5 <= 15 -> LOW stock!
            stockList.add(stock);
            Map<String, Object> stockBody = new HashMap<>();
            stockBody.put("data", stockList);
            when(restTemplate.getForObject("http://localhost:8083/warehouses/5/stock", Map.class))
                    .thenReturn(stockBody);

            List<InventorySnapshot> result = reportService.getLowStockReport();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getQuantity()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("movement & spend reports")
    class MovementAndSpend {

        @Test
        @DisplayName("identifies top moving products successfully")
        void getTopMovingProducts() {
            List<Map<String, Object>> movements = new ArrayList<>();
            Map<String, Object> m1 = new HashMap<>();
            m1.put("productId", 10);
            m1.put("movementType", "STOCK_OUT");
            m1.put("quantity", 20);
            movements.add(m1);

            Map<String, Object> m2 = new HashMap<>();
            m2.put("productId", 20);
            m2.put("movementType", "STOCK_OUT");
            m2.put("quantity", 50);
            movements.add(m2);

            Map<String, Object> body = new HashMap<>();
            body.put("data", movements);

            when(restTemplate.getForObject("http://localhost:8086/movements", Map.class))
                    .thenReturn(body);

            List<Integer> result = reportService.getTopMovingProducts(5);

            assertThat(result).hasSize(2);
            assertThat(result.get(0)).isEqualTo(20); // 50 units first
        }

        @Test
        @DisplayName("returns PO Spend summary for date range based on approved totals")
        void getPOSummary() {
            List<Map<String, Object>> pos = new ArrayList<>();
            Map<String, Object> po1 = new HashMap<>();
            po1.put("status", "APPROVED");
            po1.put("totalAmount", 1200.0);
            pos.add(po1);

            Map<String, Object> po2 = new HashMap<>();
            po2.put("status", "DRAFT");
            po2.put("totalAmount", 500.0);
            pos.add(po2);

            Map<String, Object> body = new HashMap<>();
            body.put("data", pos);

            LocalDate start = LocalDate.now().minusDays(5);
            LocalDate end = LocalDate.now();

            String expectedUrl = String.format("http://localhost:8084/purchase-orders/date-range?start=%s&end=%s", start, end);
            when(restTemplate.getForObject(expectedUrl, Map.class))
                    .thenReturn(body);

            Map<String, Object> result = reportService.getPOSummary(start, end);

            assertThat(result).containsKey("totalOrders");
            assertThat(result.get("totalOrders")).isEqualTo(2);
            assertThat(result.get("totalAmount")).isEqualTo(1200.0); // draft ignored
        }
    }

    @Nested
    @DisplayName("runSync()")
    class GlobalSync {

        @Test
        @DisplayName("runs reconciliation and updates product global stock on discrepancy")
        void reconcileDiscrepancy() {
            List<Map<String, Object>> products = new ArrayList<>();
            Map<String, Object> p1 = new HashMap<>();
            p1.put("productId", 10);
            p1.put("currentQuantity", 80); // global qty
            products.add(p1);

            Map<String, Object> prodBody = new HashMap<>();
            prodBody.put("data", products);
            when(restTemplate.getForObject("http://localhost:8082/products", Map.class))
                    .thenReturn(prodBody);

            List<Map<String, Object>> stockLevels = new ArrayList<>();
            Map<String, Object> s1 = new HashMap<>();
            s1.put("quantity", 100); // physical total
            stockLevels.add(s1);

            Map<String, Object> stockBody = new HashMap<>();
            stockBody.put("data", stockLevels);
            when(restTemplate.getForObject("http://localhost:8083/warehouses/stock/product/10", Map.class))
                    .thenReturn(stockBody);

            reportService.runSync();

            // Should call restTemplate.put with delta = +20 (100 - 80)
            verify(restTemplate).put("http://localhost:8082/products/10/stock?quantity=20", null);
        }
    }
}
