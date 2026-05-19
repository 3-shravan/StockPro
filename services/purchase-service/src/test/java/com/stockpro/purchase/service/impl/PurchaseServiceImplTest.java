package com.stockpro.purchase.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.stockpro.purchase.entity.POLineItem;
import com.stockpro.purchase.entity.PurchaseOrder;
import com.stockpro.purchase.entity.PurchaseOrderStatus;
import com.stockpro.purchase.exception.CustomException;
import com.stockpro.purchase.exception.ResourceNotFoundException;
import com.stockpro.purchase.repository.PurchaseRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("PurchaseServiceImpl")
class PurchaseServiceImplTest {

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private PurchaseServiceImpl purchaseService;

    private PurchaseOrder order;
    private POLineItem item;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(purchaseService, "warehouseServiceUrl", "http://localhost:8083");
        ReflectionTestUtils.setField(purchaseService, "alertServiceUrl", "http://localhost:8084");
        ReflectionTestUtils.setField(purchaseService, "movementServiceUrl", "http://localhost:8086");
        ReflectionTestUtils.setField(purchaseService, "productServiceUrl", "http://localhost:8082");

        order = new PurchaseOrder();
        order.setPoId(1);
        order.setSupplierId(10);
        order.setWarehouseId(5);
        order.setCreatedById(100);
        order.setStatus(PurchaseOrderStatus.DRAFT);
        order.setOrderDate(LocalDate.now());
        order.setExpectedDate(LocalDate.now().plusDays(5));
        order.setReferenceNumber("PO-001");

        item = new POLineItem();
        item.setLineItemId(1);
        item.setProductId(20);
        item.setQuantity(50);
        item.setUnitCost(5.0);
        item.setReceivedQty(0);

        order.addLineItem(item);
    }

    @Nested
    @DisplayName("createPO()")
    class CreatePO {

        @Test
        @DisplayName("saves PO with PENDING_APPROVAL status and calculated totals")
        void success() {
            when(purchaseRepository.save(any(PurchaseOrder.class))).thenReturn(order);

            PurchaseOrder result = purchaseService.createPO(order);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(PurchaseOrderStatus.PENDING_APPROVAL);
            assertThat(result.getTotalAmount()).isEqualTo(250.0); // 50 * 5.0
            assertThat(item.getTotalCost()).isEqualTo(250.0);
            assertThat(item.getReceivedQty()).isEqualTo(0);
            verify(purchaseRepository).save(order);
        }
    }

    @Nested
    @DisplayName("approvePO() & submitForApproval()")
    class Approvals {

        @Test
        @DisplayName("approves PO and dispatches status alerts successfully")
        void approveSuccess() {
            order.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));
            when(purchaseRepository.save(order)).thenReturn(order);

            purchaseService.approvePO(1);

            assertThat(order.getStatus()).isEqualTo(PurchaseOrderStatus.APPROVED);
            verify(purchaseRepository).save(order);
            // Verify alert rest calls were triggered
            verify(restTemplate).exchange(
                    eq("http://localhost:8084/alerts/clear-type?type=PO_PENDING&warehouseId=5"),
                    eq(HttpMethod.DELETE),
                    eq(HttpEntity.EMPTY),
                    eq(Void.class)
            );
        }

        @Test
        @DisplayName("approvePO throws BAD_REQUEST when PO is not DRAFT or PENDING_APPROVAL")
        void approveWrongStatus_throwsException() {
            order.setStatus(PurchaseOrderStatus.CANCELLED);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));

            CustomException ex = catchThrowableOfType(
                    () -> purchaseService.approvePO(1), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            verify(purchaseRepository, never()).save(any());
        }

        @Test
        @DisplayName("submits draft PO for approval successfully")
        void submitForApprovalSuccess() {
            order.setStatus(PurchaseOrderStatus.DRAFT);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));
            when(purchaseRepository.save(order)).thenReturn(order);

            purchaseService.submitForApproval(1);

            assertThat(order.getStatus()).isEqualTo(PurchaseOrderStatus.PENDING_APPROVAL);
        }
    }

    @Nested
    @DisplayName("receiveGoods()")
    class ReceiveGoods {

        @Test
        @DisplayName("receives goods partially and updates downstream warehouse-service stock")
        void receivePartialSuccess() {
            order.setStatus(PurchaseOrderStatus.APPROVED);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));

            POLineItem receiveItem = new POLineItem();
            receiveItem.setProductId(20);
            receiveItem.setQuantity(20);

            // Mock warehouse put request
            when(restTemplate.exchange(
                    eq("http://localhost:8083/warehouses/stock/adjust"),
                    eq(HttpMethod.PUT),
                    any(HttpEntity.class),
                    eq(Void.class)
            )).thenReturn(new ResponseEntity<>(HttpStatus.OK));

            when(purchaseRepository.save(order)).thenReturn(order);

            purchaseService.receiveGoods(1, List.of(receiveItem));

            assertThat(item.getReceivedQty()).isEqualTo(20);
            assertThat(order.getStatus()).isEqualTo(PurchaseOrderStatus.PARTIALLY_RECEIVED);
            verify(purchaseRepository).save(order);
        }

        @Test
        @DisplayName("receives all goods, completes PO, and clears alerts")
        void receiveFullSuccess() {
            order.setStatus(PurchaseOrderStatus.APPROVED);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));

            POLineItem receiveItem = new POLineItem();
            receiveItem.setProductId(20);
            receiveItem.setQuantity(50);

            when(restTemplate.exchange(
                    eq("http://localhost:8083/warehouses/stock/adjust"),
                    eq(HttpMethod.PUT),
                    any(HttpEntity.class),
                    eq(Void.class)
            )).thenReturn(new ResponseEntity<>(HttpStatus.OK));

            when(purchaseRepository.save(order)).thenReturn(order);

            purchaseService.receiveGoods(1, List.of(receiveItem));

            assertThat(item.getReceivedQty()).isEqualTo(50);
            assertThat(order.getStatus()).isEqualTo(PurchaseOrderStatus.FULLY_RECEIVED);
            assertThat(order.getReceivedDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("throws BAD_REQUEST when physical received qty exceeds ordered qty limit")
        void receiveExceedsLimit_throwsException() {
            order.setStatus(PurchaseOrderStatus.APPROVED);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));

            POLineItem receiveItem = new POLineItem();
            receiveItem.setProductId(20);
            receiveItem.setQuantity(60); // ordered is 50

            CustomException ex = catchThrowableOfType(
                    () -> purchaseService.receiveGoods(1, List.of(receiveItem)), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            verify(purchaseRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("cancelPO()")
    class CancelPO {

        @Test
        @DisplayName("cancels PO successfully when DRAFT or APPROVED")
        void success() {
            order.setStatus(PurchaseOrderStatus.APPROVED);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));
            when(purchaseRepository.save(order)).thenReturn(order);

            purchaseService.cancelPO(1);

            assertThat(order.getStatus()).isEqualTo(PurchaseOrderStatus.CANCELLED);
            verify(purchaseRepository).save(order);
        }

        @Test
        @DisplayName("throws BAD_REQUEST when cancelling already received PO")
        void alreadyReceived_throwsException() {
            order.setStatus(PurchaseOrderStatus.FULLY_RECEIVED);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));

            CustomException ex = catchThrowableOfType(
                    () -> purchaseService.cancelPO(1), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
            verify(purchaseRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("updatePO()")
    class UpdatePO {

        @Test
        @DisplayName("updates header fields and replaces line items when PO is DRAFT")
        void success() {
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));
            when(purchaseRepository.save(order)).thenReturn(order);

            PurchaseOrder updated = new PurchaseOrder();
            updated.setSupplierId(15);
            updated.setWarehouseId(6);
            updated.setExpectedDate(LocalDate.now().plusDays(10));
            updated.setNotes("Updated notes");
            updated.setReferenceNumber("PO-001-REV");

            POLineItem newItem = new POLineItem();
            newItem.setProductId(25);
            newItem.setQuantity(10);
            newItem.setUnitCost(15.0);

            updated.addLineItem(newItem);

            PurchaseOrder result = purchaseService.updatePO(1, updated);

            assertThat(result).isNotNull();
            assertThat(order.getSupplierId()).isEqualTo(15);
            assertThat(order.getWarehouseId()).isEqualTo(6);
            assertThat(order.getLineItems()).hasSize(1);
            assertThat(order.getLineItems().get(0).getProductId()).isEqualTo(25);
            assertThat(order.getTotalAmount()).isEqualTo(150.0);
        }

        @Test
        @DisplayName("throws BAD_REQUEST when updating a non-DRAFT PO")
        void nonDraft_throwsException() {
            order.setStatus(PurchaseOrderStatus.APPROVED);
            when(purchaseRepository.findById(1)).thenReturn(Optional.of(order));

            CustomException ex = catchThrowableOfType(
                    () -> purchaseService.updatePO(1, order), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    @Nested
    @DisplayName("retrievals & lists")
    class Retrievals {

        @Test
        @DisplayName("returns list of POs by supplier")
        void getPOsBySupplier() {
            when(purchaseRepository.findBySupplierId(10)).thenReturn(List.of(order));

            List<PurchaseOrder> result = purchaseService.getPOsBySupplier(10);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns list of POs by warehouse")
        void getPOsByWarehouse() {
            when(purchaseRepository.findByWarehouseId(5)).thenReturn(List.of(order));

            List<PurchaseOrder> result = purchaseService.getPOsByWarehouse(5);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns list of POs by status")
        void getPOsByStatus() {
            when(purchaseRepository.findByStatus(PurchaseOrderStatus.DRAFT)).thenReturn(List.of(order));

            List<PurchaseOrder> result = purchaseService.getPOsByStatus(PurchaseOrderStatus.DRAFT);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns list of POs by date range")
        void getPOsByDateRange() {
            LocalDate start = LocalDate.now().minusDays(1);
            LocalDate end = LocalDate.now().plusDays(1);
            when(purchaseRepository.findByOrderDateBetween(start, end)).thenReturn(List.of(order));

            List<PurchaseOrder> result = purchaseService.getPOsByDateRange(start, end);

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("dispatchOverdueReceiptAlerts()")
    class Schedulers {

        @Test
        @DisplayName("dispatches critical overdue alerts for approved POs past expected date")
        void success() {
            order.setStatus(PurchaseOrderStatus.APPROVED);
            order.setExpectedDate(LocalDate.now().minusDays(2)); // overdue

            when(purchaseRepository.findByStatus(PurchaseOrderStatus.APPROVED)).thenReturn(List.of(order));

            purchaseService.dispatchOverdueReceiptAlerts();

            verify(restTemplate).postForEntity(
                    eq("http://localhost:8084/alerts"),
                    any(),
                    eq(Object.class)
            );
        }
    }
}
