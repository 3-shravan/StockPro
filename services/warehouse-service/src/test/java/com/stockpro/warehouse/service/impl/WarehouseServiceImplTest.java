package com.stockpro.warehouse.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.stockpro.warehouse.dto.request.StockUpdateRequest;
import com.stockpro.warehouse.dto.request.WarehouseRequest;
import com.stockpro.warehouse.dto.response.StockLevelResponse;
import com.stockpro.warehouse.dto.response.WarehouseResponse;
import com.stockpro.warehouse.dto.response.WarehouseStatsResponse;
import com.stockpro.warehouse.entity.StockLevel;
import com.stockpro.warehouse.entity.Warehouse;
import com.stockpro.warehouse.exception.CustomException;
import com.stockpro.warehouse.mapper.StockMapper;
import com.stockpro.warehouse.mapper.WarehouseMapper;
import com.stockpro.warehouse.repository.StockLevelRepository;
import com.stockpro.warehouse.repository.WarehouseRepository;
import com.stockpro.warehouse.common.response.ApiResponse;

@ExtendWith(MockitoExtension.class)
@DisplayName("WarehouseServiceImpl")
class WarehouseServiceImplTest {

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private StockLevelRepository stockLevelRepository;

    @Mock
    private WarehouseMapper warehouseMapper;

    @Mock
    private StockMapper stockMapper;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private WarehouseServiceImpl warehouseService;

    private Warehouse warehouse;
    private WarehouseRequest request;
    private WarehouseResponse response;
    private StockLevel stockLevel;
    private StockLevelResponse stockResponse;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(warehouseService, "alertServiceUrl", "http://localhost:8084");
        ReflectionTestUtils.setField(warehouseService, "lowStockThreshold", 10);
        ReflectionTestUtils.setField(warehouseService, "overstockThreshold", 200);
        ReflectionTestUtils.setField(warehouseService, "productServiceUrl", "http://localhost:8082");
        ReflectionTestUtils.setField(warehouseService, "movementServiceUrl", "http://localhost:8086");

        warehouse = Warehouse.builder()
                .warehouseId(5)
                .name("Central Hub")
                .location("Chicago")
                .address("123 Logistics St")
                .managerId(10)
                .capacity(1000)
                .usedCapacity(300)
                .active(true)
                .createdAt(LocalDate.now())
                .build();

        request = WarehouseRequest.builder()
                .name("Central Hub")
                .location("Chicago")
                .address("123 Logistics St")
                .managerId(10)
                .capacity(1000)
                .build();

        response = new WarehouseResponse();
        response.setWarehouseId(5);
        response.setName("Central Hub");
        response.setLocation("Chicago");
        response.setAddress("123 Logistics St");
        response.setManagerId(10);
        response.setCapacity(1000);
        response.setUsedCapacity(300);
        response.setActive(true);

        stockLevel = new StockLevel(1, 5, 10, 100, 10, "A-1", LocalDateTime.now());

        stockResponse = new StockLevelResponse();
        stockResponse.setStockId(1);
        stockResponse.setWarehouseId(5);
        stockResponse.setProductId(10);
        stockResponse.setQuantity(100);
        stockResponse.setReservedQuantity(10);
        stockResponse.setLocation("A-1");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("createWarehouse()")
    class CreateWarehouse {

        @Test
        @DisplayName("saves and returns warehouse when manager has no active hubs")
        void success() {
            when(warehouseRepository.findByManagerId(10)).thenReturn(Collections.emptyList());
            when(warehouseMapper.toEntity(request)).thenReturn(warehouse);
            when(warehouseRepository.save(warehouse)).thenReturn(warehouse);
            when(warehouseMapper.toResponse(warehouse)).thenReturn(response);

            WarehouseResponse result = warehouseService.createWarehouse(request);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Central Hub");
            verify(warehouseRepository).save(warehouse);
        }

        @Test
        @DisplayName("throws CONFLICT when manager already manages another active warehouse")
        void managerAlreadyAssigned_throwsConflict() {
            Warehouse other = Warehouse.builder().warehouseId(6).active(true).build();
            when(warehouseRepository.findByManagerId(10)).thenReturn(List.of(other));

            CustomException ex = catchThrowableOfType(
                    () -> warehouseService.createWarehouse(request), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            verify(warehouseRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getAllWarehouses() & syncCapacity")
    class GetAllWarehouses {

        @Test
        @DisplayName("returns list of warehouses and auto-heals used capacity mismatch")
        void successAutoHeal() {
            List<Object[]> sumList = new ArrayList<>();
            sumList.add(new Object[]{5, 350}); // Mismatch: 350 physical vs 300 cached

            when(warehouseRepository.findByActive(true)).thenReturn(List.of(warehouse));
            when(stockLevelRepository.sumQuantitiesByWarehouse()).thenReturn(sumList);
            when(warehouseMapper.toResponse(warehouse)).thenReturn(response);

            List<WarehouseResponse> result = warehouseService.getAllWarehouses(false);

            assertThat(result).hasSize(1);
            assertThat(warehouse.getUsedCapacity()).isEqualTo(350);
            verify(warehouseRepository).save(warehouse); // updated capacity saved
        }
    }

    @Nested
    @DisplayName("updateWarehouse()")
    class UpdateWarehouse {

        private SecurityContext securityContext;
        private Authentication authentication;

        @BeforeEach
        void setupSecurity() {
            securityContext = mock(SecurityContext.class);
            authentication = mock(Authentication.class);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            SecurityContextHolder.setContext(securityContext);
        }

        @Test
        @DisplayName("updates warehouse successfully as ADMIN role")
        void successAsAdmin() {
            GrantedAuthority adminAuthority = new SimpleGrantedAuthority("ROLE_ADMIN");
            when(authentication.getAuthorities()).thenReturn((List) List.of(adminAuthority));

            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));
            when(warehouseRepository.save(warehouse)).thenReturn(warehouse);
            when(warehouseMapper.toResponse(warehouse)).thenReturn(response);

            WarehouseResponse result = warehouseService.updateWarehouse(5, request);

            assertThat(result).isNotNull();
            verify(warehouseMapper).updateEntity(request, warehouse);
            verify(warehouseRepository).save(warehouse);
        }

        @Test
        @DisplayName("updates warehouse successfully as assigned MANAGER user")
        void successAsAssignedManager() {
            GrantedAuthority managerAuthority = new SimpleGrantedAuthority("ROLE_MANAGER");
            when(authentication.getAuthorities()).thenReturn((List) List.of(managerAuthority));

            Map<String, Object> details = Map.of("userId", 10); // Matches warehouse managerId=10
            when(authentication.getDetails()).thenReturn(details);

            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));
            when(warehouseRepository.save(warehouse)).thenReturn(warehouse);
            when(warehouseMapper.toResponse(warehouse)).thenReturn(response);

            WarehouseResponse result = warehouseService.updateWarehouse(5, request);

            assertThat(result).isNotNull();
            verify(warehouseRepository).save(warehouse);
        }

        @Test
        @DisplayName("throws FORBIDDEN when regular manager user attempts to update someone else's hub")
        void forbiddenForWrongManager() {
            GrantedAuthority managerAuthority = new SimpleGrantedAuthority("ROLE_MANAGER");
            when(authentication.getAuthorities()).thenReturn((List) List.of(managerAuthority));

            Map<String, Object> details = Map.of("userId", 99); // Does not match managerId=10
            when(authentication.getDetails()).thenReturn(details);

            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));

            CustomException ex = catchThrowableOfType(
                    () -> warehouseService.updateWarehouse(5, request), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            verify(warehouseRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("deactivate & activate & delete")
    class Lifecycle {

        @Test
        @DisplayName("deactivates warehouse successfully")
        void deactivateSuccess() {
            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));
            when(warehouseRepository.save(warehouse)).thenReturn(warehouse);

            warehouseService.deactivateWarehouse(5);

            assertThat(warehouse.isActive()).isFalse();
        }

        @Test
        @DisplayName("activates warehouse successfully")
        void activateSuccess() {
            warehouse.setActive(false);
            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));
            when(warehouseRepository.save(warehouse)).thenReturn(warehouse);

            warehouseService.activateWarehouse(5);

            assertThat(warehouse.isActive()).isTrue();
        }

        @Test
        @DisplayName("deletes warehouse and cleans up all associated stock records")
        void deleteSuccess() {
            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));

            warehouseService.deleteWarehouse(5);

            verify(stockLevelRepository).deleteByWarehouseId(5);
            verify(warehouseRepository).delete(warehouse);
        }
    }

    @Nested
    @DisplayName("stock operations: updates and delta adjustments")
    class StockOperations {

        @Test
        @DisplayName("adjusts stock (increment) and publishes stock movement and product global stock REST syncs")
        void adjustStockIncrement() {
            when(warehouseRepository.existsById(5)).thenReturn(true);
            when(stockLevelRepository.findByWarehouseIdAndProductId(5, 10)).thenReturn(Optional.of(stockLevel));
            when(stockLevelRepository.save(stockLevel)).thenReturn(stockLevel);
            when(stockLevelRepository.sumQuantityByWarehouseId(5)).thenReturn(140);
            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));

            // Mock Product service global stock sync PUT response
            ApiResponse<Map<String, Object>> syncResponse = ApiResponse.success("success", Map.of("reorderLevel", 50, "maxStockLevel", 300));
            when(restTemplate.exchange(
                    eq("http://localhost:8082/products/10/stock?quantity=40"),
                    eq(HttpMethod.PUT),
                    eq(null),
                    eq(ApiResponse.class)
            )).thenReturn(new ResponseEntity<>(syncResponse, HttpStatus.OK));

            StockUpdateRequest adjRequest = StockUpdateRequest.builder()
                    .warehouseId(5)
                    .productId(10)
                    .quantity(40)
                    .build();

            warehouseService.adjustStock(adjRequest);

            assertThat(stockLevel.getQuantity()).isEqualTo(140);
            verify(stockLevelRepository).save(stockLevel);
            verify(warehouseRepository).save(warehouse); // usedCapacity reconciled to 140
            
            // Should post to movement service
            verify(restTemplate).postForEntity(
                    eq("http://localhost:8086/movements"),
                    any(Map.class),
                    eq(Void.class)
            );
        }

        @Test
        @DisplayName("adjusts stock (decrement) and triggers critical low-stock alert when available stock goes under safety threshold")
        void adjustStockDecrementTriggersAlert() {
            when(warehouseRepository.existsById(5)).thenReturn(true);
            
            // Quantity is 100, delta is -95 -> leaves 5 available units which is < 10 (lowThreshold)
            when(stockLevelRepository.findByWarehouseIdAndProductId(5, 10)).thenReturn(Optional.of(stockLevel));
            when(stockLevelRepository.save(stockLevel)).thenReturn(stockLevel);
            when(stockLevelRepository.sumQuantityByWarehouseId(5)).thenReturn(5);
            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));

            ApiResponse<Map<String, Object>> syncResponse = ApiResponse.success("success", Map.of("reorderLevel", 15)); // Custom product threshold
            when(restTemplate.exchange(
                    eq("http://localhost:8082/products/10/stock?quantity=-95"),
                    eq(HttpMethod.PUT),
                    eq(null),
                    eq(ApiResponse.class)
            )).thenReturn(new ResponseEntity<>(syncResponse, HttpStatus.OK));

            StockUpdateRequest adjRequest = StockUpdateRequest.builder()
                    .warehouseId(5)
                    .productId(10)
                    .quantity(-95)
                    .build();

            warehouseService.adjustStock(adjRequest);

            assertThat(stockLevel.getQuantity()).isEqualTo(5);
            
            // Should post critical low-stock alert endpoint
            verify(restTemplate).postForEntity(
                    eq("http://localhost:8084/alerts/low-stock?productId=10&warehouseId=5&currentQty=-5"), // 5 qty - 10 reserved = -5 available
                    eq(null),
                    eq(Void.class)
            );
        }
    }

    @Nested
    @DisplayName("stock reservations & releases & transfers")
    class ReservationsAndTransfers {

        @Test
        @DisplayName("reserves stock successfully when available quantity is sufficient")
        void reserveStockSuccess() {
            when(stockLevelRepository.findByWarehouseIdAndProductId(5, 10)).thenReturn(Optional.of(stockLevel));

            warehouseService.reserveStock(5, 10, 40); // 100 quantity - 10 reserved = 90 available. 40 <= 90 is OK!

            assertThat(stockLevel.getReservedQuantity()).isEqualTo(50);
            verify(stockLevelRepository).save(stockLevel);
        }

        @Test
        @DisplayName("throws BAD_REQUEST when attempting to reserve more stock than is available")
        void reserveStockInsufficient_throwsException() {
            when(stockLevelRepository.findByWarehouseIdAndProductId(5, 10)).thenReturn(Optional.of(stockLevel));

            CustomException ex = catchThrowableOfType(
                    () -> warehouseService.reserveStock(5, 10, 95), CustomException.class); // 95 > 90 available

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            verify(stockLevelRepository, never()).save(any());
        }

        @Test
        @DisplayName("releases reserved stock successfully")
        void releaseStockSuccess() {
            when(stockLevelRepository.findByWarehouseIdAndProductId(5, 10)).thenReturn(Optional.of(stockLevel));

            warehouseService.releaseStock(5, 10, 5);

            assertThat(stockLevel.getReservedQuantity()).isEqualTo(5);
            verify(stockLevelRepository).save(stockLevel);
        }

        @Test
        @DisplayName("transfers stock between two hubs atomically and triggers movement recordings")
        void transferStockSuccess() {
            StockLevel source = new StockLevel(1, 5, 10, 100, 0, null, LocalDateTime.now());
            StockLevel dest = new StockLevel(2, 6, 10, 20, 0, null, LocalDateTime.now());

            when(stockLevelRepository.findByWarehouseIdAndProductId(5, 10)).thenReturn(Optional.of(source));
            when(stockLevelRepository.findByWarehouseIdAndProductId(6, 10)).thenReturn(Optional.of(dest));

            when(stockLevelRepository.save(source)).thenReturn(source);
            when(stockLevelRepository.save(dest)).thenReturn(dest);

            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));
            when(warehouseRepository.findByWarehouseId(6)).thenReturn(Optional.of(warehouse));

            warehouseService.transferStock(5, 6, 10, 30);

            assertThat(source.getQuantity()).isEqualTo(70);
            assertThat(dest.getQuantity()).isEqualTo(50);
            
            verify(stockLevelRepository).save(source);
            verify(stockLevelRepository).save(dest);

            // Verifies 2 movement records (Transfer out and transfer in) + product global syncs
            verify(restTemplate, times(2)).postForEntity(
                    eq("http://localhost:8086/movements"),
                    any(Map.class),
                    eq(Void.class)
            );
        }
    }

    @Nested
    @DisplayName("warehouse statistics")
    class WarehouseStats {

        @Test
        @DisplayName("aggregates stats, fetches top-moving names via REST, and calculates correct occupancy rates")
        void getWarehouseStats() {
            when(warehouseRepository.findByWarehouseId(5)).thenReturn(Optional.of(warehouse));
            when(stockLevelRepository.sumQuantityByWarehouseId(5)).thenReturn(300);
            when(stockLevelRepository.countUniqueProductsByWarehouseId(5)).thenReturn(3);
            when(stockLevelRepository.findTopProductsByWarehouseId(5, 5)).thenReturn(List.of(stockLevel));

            // Mock product name lookup for top items
            Map<String, Object> productBody = new HashMap<>();
            productBody.put("data", Map.of("name", "Premium Widgets"));
            when(restTemplate.getForObject("http://localhost:8082/products/10", Map.class))
                    .thenReturn(productBody);

            WarehouseStatsResponse stats = warehouseService.getWarehouseStats(5);

            assertThat(stats).isNotNull();
            assertThat(stats.getWarehouseId()).isEqualTo(5);
            assertThat(stats.getTotalItems()).isEqualTo(300);
            assertThat(stats.getUtilizedPercentage()).isEqualTo(30.0); // 300 / 1000 capacity
            assertThat(stats.getTopProducts()).hasSize(1);
            assertThat(stats.getTopProducts().get(0).getProductName()).isEqualTo("Premium Widgets");
        }
    }
}
