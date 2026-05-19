package com.stockpro.movement.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
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
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.stockpro.movement.dto.request.StockMovementRequest;
import com.stockpro.movement.dto.response.StockMovementResponse;
import com.stockpro.movement.entity.MovementType;
import com.stockpro.movement.entity.StockMovement;
import com.stockpro.movement.exception.CustomException;
import com.stockpro.movement.mapper.MovementMapper;
import com.stockpro.movement.repository.MovementRepository;
import com.stockpro.movement.common.response.ApiResponse;

@ExtendWith(MockitoExtension.class)
@DisplayName("MovementServiceImpl")
class MovementServiceImplTest {

    @Mock
    private MovementRepository movementRepository;

    @Mock
    private MovementMapper movementMapper;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private MovementServiceImpl movementService;

    private StockMovement movement;
    private StockMovementRequest request;
    private StockMovementResponse response;

    @BeforeEach
    void setUp() {
        // Set @Value properties
        ReflectionTestUtils.setField(movementService, "productServiceUrl", "http://localhost:8082");
        ReflectionTestUtils.setField(movementService, "warehouseServiceUrl", "http://localhost:8083");

        movement = StockMovement.builder()
                .movementId(1)
                .productId(10)
                .warehouseId(5)
                .movementType(MovementType.STOCK_IN)
                .quantity(100)
                .referenceId(1)
                .referenceType("PURCHASE_ORDER")
                .unitCost(10.0)
                .performedBy(1)
                .notes("Test notes")
                .movementDate(LocalDateTime.now())
                .productName("Item #10")
                .warehouseName("WH #5")
                .balanceAfter(100)
                .build();

        request = StockMovementRequest.builder()
                .productId(10)
                .warehouseId(5)
                .movementType("STOCK_IN")
                .quantity(100)
                .referenceId(1)
                .referenceType("PURCHASE_ORDER")
                .unitCost(10.0)
                .performedBy(1)
                .notes("Test notes")
                .build();

        response = new StockMovementResponse();
        response.setMovementId(1);
        response.setProductId(10);
        response.setWarehouseId(5);
        response.setMovementType(MovementType.STOCK_IN);
        response.setQuantity(100);
        response.setReferenceId(1);
        response.setReferenceType("PURCHASE_ORDER");
        response.setUnitCost(10.0);
        response.setPerformedBy(1);
        response.setNotes("Test notes");
        response.setMovementDate(movement.getMovementDate());
        response.setProductName("Item #10");
        response.setWarehouseName("WH #5");
        response.setBalanceAfter(100);
    }

    @Nested
    @DisplayName("recordMovement()")
    class RecordMovement {

        @Test
        @DisplayName("saves movement and fetches names from external services successfully")
        void success() {
            when(movementMapper.toEntity(any(StockMovementRequest.class))).thenReturn(movement);

            // Mock Product service name lookup
            Map<String, Object> productData = new HashMap<>();
            productData.put("name", "Premium Product");
            ApiResponse<Map<String, Object>> productApi = ApiResponse.success("success", productData);
            when(restTemplate.exchange(
                    eq("http://localhost:8082/products/10"),
                    eq(HttpMethod.GET),
                    eq(HttpEntity.EMPTY),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(productApi, HttpStatus.OK));

            // Mock Warehouse service name lookup
            Map<String, Object> whData = new HashMap<>();
            whData.put("name", "Central Hub");
            ApiResponse<Map<String, Object>> whApi = ApiResponse.success("success", whData);
            when(restTemplate.exchange(
                    eq("http://localhost:8083/warehouses/5"),
                    eq(HttpMethod.GET),
                    eq(HttpEntity.EMPTY),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(whApi, HttpStatus.OK));

            when(movementRepository.save(movement)).thenReturn(movement);
            when(movementMapper.toResponse(movement)).thenReturn(response);

            StockMovementResponse result = movementService.recordMovement(request);

            assertThat(result).isNotNull();
            assertThat(movement.getProductName()).isEqualTo("Premium Product");
            assertThat(movement.getWarehouseName()).isEqualTo("Central Hub");
            verify(movementRepository).save(movement);
        }

        @Test
        @DisplayName("throws CustomException when mapper fails on invalid movement type")
        void mapperException_throwsCustomException() {
            when(movementMapper.toEntity(request)).thenThrow(new IllegalArgumentException("Invalid type"));

            CustomException ex = catchThrowableOfType(
                    () -> movementService.recordMovement(request), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(ex.getMessage()).contains("Invalid movement type");
        }
    }

    @Nested
    @DisplayName("retrievals by filter")
    class RetrievalsByFilter {

        @Test
        @DisplayName("returns list of movements by product ID")
        void getByProduct() {
            when(movementRepository.findByProductId(10)).thenReturn(List.of(movement));
            when(movementMapper.toResponse(movement)).thenReturn(response);

            List<StockMovementResponse> result = movementService.getByProduct(10);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns list of movements by warehouse ID")
        void getByWarehouse() {
            when(movementRepository.findByWarehouseId(5)).thenReturn(List.of(movement));
            when(movementMapper.toResponse(movement)).thenReturn(response);

            List<StockMovementResponse> result = movementService.getByWarehouse(5);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns list of movements by type")
        void getByType() {
            when(movementRepository.findByMovementType(MovementType.STOCK_IN)).thenReturn(List.of(movement));
            when(movementMapper.toResponse(movement)).thenReturn(response);

            List<StockMovementResponse> result = movementService.getByType("STOCK_IN");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("throws CustomException on invalid type")
        void getByInvalidType_throwsCustomException() {
            CustomException ex = catchThrowableOfType(
                    () -> movementService.getByType("INVALID_TYPE"), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test
        @DisplayName("returns movements by date range when start is before end")
        void getByDateRange_success() {
            LocalDateTime start = LocalDateTime.now().minusDays(1);
            LocalDateTime end = LocalDateTime.now().plusDays(1);
            when(movementRepository.findByMovementDateBetween(start, end)).thenReturn(List.of(movement));
            when(movementMapper.toResponse(movement)).thenReturn(response);

            List<StockMovementResponse> result = movementService.getByDateRange(start, end);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("throws CustomException when start date is after end date")
        void getByDateRange_invalidRange_throwsException() {
            LocalDateTime start = LocalDateTime.now().plusDays(1);
            LocalDateTime end = LocalDateTime.now().minusDays(1);

            CustomException ex = catchThrowableOfType(
                    () -> movementService.getByDateRange(start, end), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(ex.getMessage()).contains("Start date must be before end date");
        }

        @Test
        @DisplayName("returns movements by reference ID")
        void getByReference() {
            when(movementRepository.findByReferenceId(1)).thenReturn(List.of(movement));
            when(movementMapper.toResponse(movement)).thenReturn(response);

            List<StockMovementResponse> result = movementService.getByReference(1);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns history for product in warehouse")
        void getMovementHistory() {
            when(movementRepository.findByProductIdAndWarehouseIdOrderByMovementDateAscMovementIdAsc(10, 5))
                    .thenReturn(List.of(movement));
            when(movementMapper.toResponse(movement)).thenReturn(response);

            List<StockMovementResponse> result = movementService.getMovementHistory(10, 5);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns all movements sorted")
        void getAllMovements() {
            when(movementRepository.findAll(any(Sort.class))).thenReturn(List.of(movement));
            when(movementMapper.toResponse(movement)).thenReturn(response);

            List<StockMovementResponse> result = movementService.getAllMovements();

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("aggregations")
    class Aggregations {

        @Test
        @DisplayName("sums stock in quantity correctly")
        void getStockIn() {
            when(movementRepository.sumQuantityByProductIdAndMovementType(10, MovementType.STOCK_IN)).thenReturn(150);

            int result = movementService.getStockIn(10);

            assertThat(result).isEqualTo(150);
        }

        @Test
        @DisplayName("sums stock out quantity correctly")
        void getStockOut() {
            when(movementRepository.sumQuantityByProductIdAndMovementType(10, MovementType.STOCK_OUT)).thenReturn(80);

            int result = movementService.getStockOut(10);

            assertThat(result).isEqualTo(80);
        }
    }
}
