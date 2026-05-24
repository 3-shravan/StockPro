package com.stockpro.alert.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.stockpro.alert.common.response.ApiResponse;
import com.stockpro.alert.dto.request.AlertRequest;
import com.stockpro.alert.dto.request.BulkAlertRequest;
import com.stockpro.alert.dto.response.AlertResponse;
import com.stockpro.alert.entity.Alert;
import com.stockpro.alert.entity.AlertChannel;
import com.stockpro.alert.entity.AlertSeverity;
import com.stockpro.alert.entity.AlertType;
import com.stockpro.alert.exception.CustomException;
import com.stockpro.alert.mapper.AlertMapper;
import com.stockpro.alert.repository.AlertRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("AlertServiceImpl")
class AlertServiceImplTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private AlertMapper alertMapper;

    @Mock
    private JavaMailSender emailSender;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AlertServiceImpl alertService;

    private Alert alert;
    private AlertRequest request;
    private AlertResponse response;

    @BeforeEach
    void setUp() {
        // Set @Value annotated properties
        ReflectionTestUtils.setField(alertService, "productServiceUrl", "http://localhost:8082");
        ReflectionTestUtils.setField(alertService, "warehouseServiceUrl", "http://localhost:8083");
        ReflectionTestUtils.setField(alertService, "authServiceUrl", "http://localhost:8081");
        ReflectionTestUtils.setField(alertService, "supplierServiceUrl", "http://localhost:8085");
        ReflectionTestUtils.setField(alertService, "defaultEmailTo", "alerts@stockpro.local");
        ReflectionTestUtils.setField(alertService, "emailFrom", "noreply@stockpro.local");

        alert = Alert.builder()
                .alertId(1)
                .recipientId(1)
                .type(AlertType.LOW_STOCK)
                .severity(AlertSeverity.CRITICAL)
                .title("Low Stock Alert")
                .message("Product is low in stock")
                .channel(AlertChannel.BOTH)
                .read(false)
                .acknowledged(false)
                .createdAt(LocalDateTime.now())
                .build();

        request = AlertRequest.builder()
                .recipientId(1)
                .type("LOW_STOCK")
                .severity("CRITICAL")
                .title("Low Stock Alert")
                .message("Product is low in stock")
                .channel("BOTH")
                .build();

        response = new AlertResponse();
        response.setAlertId(1);
        response.setRecipientId(1);
        response.setType(AlertType.LOW_STOCK);
        response.setSeverity(AlertSeverity.CRITICAL);
        response.setTitle("Low Stock Alert");
        response.setMessage("Product is low in stock");
        response.setChannel(AlertChannel.BOTH);
        response.setRead(false);
        response.setAcknowledged(false);
    }

    @Nested
    @DisplayName("sendAlert()")
    class SendAlert {

        @Test
        @DisplayName("saves alert and dispatches email when critical and channel supports email")
        void criticalEmailDispatched() {
            when(alertMapper.toEntity(any(AlertRequest.class))).thenReturn(alert);
            when(alertRepository.save(any(Alert.class))).thenReturn(alert);
            when(alertMapper.toResponse(any(Alert.class))).thenReturn(response);

            AlertResponse result = alertService.sendAlert(request);

            assertThat(result).isNotNull();
            verify(emailSender).send(any(SimpleMailMessage.class));
            verify(alertRepository).save(alert);
        }

        @Test
        @DisplayName("saves alert but does not email when severity is warning")
        void warningNoEmail() {
            alert.setSeverity(AlertSeverity.WARNING);
            alert.setChannel(AlertChannel.IN_APP);
            request.setSeverity("WARNING");
            request.setChannel("IN_APP");
            response.setSeverity(AlertSeverity.WARNING);
            response.setChannel(AlertChannel.IN_APP);

            when(alertMapper.toEntity(any(AlertRequest.class))).thenReturn(alert);
            when(alertRepository.save(any(Alert.class))).thenReturn(alert);
            when(alertMapper.toResponse(any(Alert.class))).thenReturn(response);

            AlertResponse result = alertService.sendAlert(request);

            assertThat(result).isNotNull();
            verify(emailSender, never()).send(any(SimpleMailMessage.class));
            verify(alertRepository).save(alert);
        }
    }

    @Nested
    @DisplayName("sendLowStockAlert() & sendOverstockAlert() & sendOverduePoAlert()")
    class BusinessFlowAlerts {

        @Test
        @DisplayName("broadcasts low stock alerts and dispatches emails to matching roles")
        void sendLowStockAlert_critical() {
            // Mock RestTemplate to get product name
            Map<String, Object> productData = new HashMap<>();
            productData.put("name", "Product ABC");
            ApiResponse<Map<String, Object>> productApi = ApiResponse.success("success", productData);
            when(restTemplate.exchange(
                    eq("http://localhost:8082/products/10"),
                    eq(HttpMethod.GET),
                    eq(null),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(productApi, HttpStatus.OK));

            // Mock RestTemplate to get warehouse name
            Map<String, Object> whData = new HashMap<>();
            whData.put("name", "Warehouse XYZ");
            ApiResponse<Map<String, Object>> whApi = ApiResponse.success("success", whData);
            when(restTemplate.exchange(
                    eq("http://localhost:8083/warehouses/5"),
                    eq(HttpMethod.GET),
                    eq(null),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(whApi, HttpStatus.OK));

            // Mock RestTemplate to get roles
            List<Map<String, Object>> users = new ArrayList<>();
            Map<String, Object> u1 = new HashMap<>();
            u1.put("role", "MANAGER");
            u1.put("email", "manager@stockpro.com");
            u1.put("warehouseId", 5);
            users.add(u1);
            ApiResponse<List<Map<String, Object>>> usersApi = ApiResponse.success("success", users);
            
            when(restTemplate.exchange(
                    eq("http://localhost:8081/auth/users"),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(usersApi, HttpStatus.OK));

            alertService.sendLowStockAlert(10, 5, 2);

            verify(alertRepository, times(2)).save(any(Alert.class));
            verify(emailSender, times(1)).send(any(SimpleMailMessage.class)); // 1 for manager (admin null warehouse not matched)
        }

        @Test
        @DisplayName("broadcasts overstock alerts to manager and admin")
        void sendOverstockAlert() {
            // Mock product and warehouse name REST calls
            Map<String, Object> productData = new HashMap<>();
            productData.put("name", "Product ABC");
            ApiResponse<Map<String, Object>> productApi = ApiResponse.success("success", productData);
            when(restTemplate.exchange(
                    eq("http://localhost:8082/products/10"),
                    eq(HttpMethod.GET),
                    eq(null),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(productApi, HttpStatus.OK));

            Map<String, Object> whData = new HashMap<>();
            whData.put("name", "Warehouse XYZ");
            ApiResponse<Map<String, Object>> whApi = ApiResponse.success("success", whData);
            when(restTemplate.exchange(
                    eq("http://localhost:8083/warehouses/5"),
                    eq(HttpMethod.GET),
                    eq(null),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(whApi, HttpStatus.OK));

            alertService.sendOverstockAlert(10, 5, 250);

            verify(alertRepository, times(2)).save(any(Alert.class));
            verify(emailSender, never()).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("broadcasts overdue PO alerts to matching roles")
        void sendOverduePoAlert() {
            // Mock supplier name
            Map<String, Object> supData = new HashMap<>();
            supData.put("name", "Supplier ABC");
            ApiResponse<Map<String, Object>> supApi = ApiResponse.success("success", supData);
            when(restTemplate.exchange(
                    eq("http://localhost:8085/suppliers/8"),
                    eq(HttpMethod.GET),
                    eq(null),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(supApi, HttpStatus.OK));

            // Mock role lookup
            List<Map<String, Object>> users = new ArrayList<>();
            Map<String, Object> u1 = new HashMap<>();
            u1.put("role", "ADMIN");
            u1.put("email", "admin@stockpro.com");
            users.add(u1);
            ApiResponse<List<Map<String, Object>>> usersApi = ApiResponse.success("success", users);
            when(restTemplate.exchange(
                    eq("http://localhost:8081/auth/users"),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(usersApi, HttpStatus.OK));

            alertService.sendOverduePoAlert(1, 8, "PO-100");

            verify(alertRepository, times(2)).save(any(Alert.class));
            verify(emailSender, times(2)).send(any(SimpleMailMessage.class)); // admin from manager email flow + admin email flow
        }
    }

    @Nested
    @DisplayName("sendBulk()")
    class SendBulk {

        @Test
        @DisplayName("saves list of alerts and emails default contact if critical")
        void success() {
            BulkAlertRequest req = BulkAlertRequest.builder()
                    .recipientIds(List.of(1, 2))
                    .type("LOW_STOCK")
                    .severity("CRITICAL")
                    .channel("BOTH")
                    .title("Bulk Title")
                    .message("Bulk Message")
                    .build();

            alertService.sendBulk(req);

            verify(alertRepository).saveAll(any(List.class));
            verify(emailSender).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("throws CustomException when bulk alert params are invalid")
        void invalidParams_throwsException() {
            BulkAlertRequest req = BulkAlertRequest.builder()
                    .recipientIds(List.of(1, 2))
                    .type("INVALID_TYPE")
                    .severity("CRITICAL")
                    .channel("BOTH")
                    .build();

            CustomException ex = catchThrowableOfType(
                    () -> alertService.sendBulk(req), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    @Nested
    @DisplayName("markAsRead() & acknowledge() & lifecycle")
    class AlertStateChanges {

        @Test
        @DisplayName("marks single alert as read")
        void markAsReadSuccess() {
            when(alertRepository.findById(1)).thenReturn(Optional.of(alert));

            alertService.markAsRead(1);

            assertThat(alert.isRead()).isTrue();
            verify(alertRepository).save(alert);
        }

        @Test
        @DisplayName("marks all alerts of recipient as read")
        void markAllReadSuccess() {
            when(alertRepository.findByRecipientIdAndRead(1, false)).thenReturn(List.of(alert));

            alertService.markAllRead(1);

            assertThat(alert.isRead()).isTrue();
            verify(alertRepository).saveAll(any(List.class));
        }

        @Test
        @DisplayName("acknowledges alert successfully")
        void acknowledgeSuccess() {
            when(alertRepository.findById(1)).thenReturn(Optional.of(alert));

            alertService.acknowledge(1, 10);

            assertThat(alert.isAcknowledged()).isTrue();
            assertThat(alert.getAcknowledgedBy()).isEqualTo(10);
            assertThat(alert.getAcknowledgedAt()).isNotNull();
            verify(alertRepository).save(alert);
        }
    }

    @Nested
    @DisplayName("retrievals & deletions")
    class RetrievalsAndDeletions {

        @Test
        @DisplayName("gets alerts by recipient and enriches acknowledged user names via REST")
        void getByRecipientEnriched() {
            alert.setAcknowledged(true);
            alert.setAcknowledgedBy(10);
            response.setAcknowledged(true);
            response.setAcknowledgedBy(10);

            when(alertRepository.findByRecipientId(1)).thenReturn(List.of(alert));
            when(alertMapper.toResponse(alert)).thenReturn(response);

            // Mock RestTemplate to get user name
            Map<String, Object> userData = new HashMap<>();
            userData.put("fullName", "User Ten");
            ApiResponse<Map<String, Object>> userApi = ApiResponse.success("success", userData);
            when(restTemplate.exchange(
                    eq("http://localhost:8081/auth/users/10"),
                    eq(HttpMethod.GET),
                    eq(null),
                    any(ParameterizedTypeReference.class)))
                    .thenReturn(new ResponseEntity<>(userApi, HttpStatus.OK));

            List<AlertResponse> result = alertService.getByRecipient(1);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAcknowledgedByName()).isEqualTo("User Ten");
        }

        @Test
        @DisplayName("deletes alert successfully when found")
        void deleteSuccess() {
            when(alertRepository.existsById(1)).thenReturn(true);

            alertService.deleteAlert(1);

            verify(alertRepository).deleteByAlertId(1);
        }

        @Test
        @DisplayName("delete throws NOT_FOUND when alert not found")
        void deleteNotFound() {
            when(alertRepository.existsById(99)).thenReturn(false);

            CustomException ex = catchThrowableOfType(
                    () -> alertService.deleteAlert(99), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("deduplication & capping logic")
    class DeduplicationAndCapping {

        @Test
        @DisplayName("skips low stock alert when unacknowledged alert of same product and warehouse exists")
        void skipLowStockAlertIfUnacknowledgedExists() {
            when(alertRepository.existsByTypeAndRelatedProductIdAndRelatedWarehouseIdAndAcknowledgedFalse(
                    AlertType.LOW_STOCK, 10, 5)).thenReturn(true);

            alertService.sendLowStockAlert(10, 5, 2);

            verify(alertRepository, never()).save(any(Alert.class));
            verify(restTemplate, never()).exchange(any(), any(), any(), any(ParameterizedTypeReference.class));
        }

        @Test
        @DisplayName("skips overstock alert when unacknowledged alert of same product and warehouse exists")
        void skipOverstockAlertIfUnacknowledgedExists() {
            when(alertRepository.existsByTypeAndRelatedProductIdAndRelatedWarehouseIdAndAcknowledgedFalse(
                    AlertType.OVERSTOCK, 10, 5)).thenReturn(true);

            alertService.sendOverstockAlert(10, 5, 250);

            verify(alertRepository, never()).save(any(Alert.class));
        }

        @Test
        @DisplayName("caps alert history by deleting oldest alerts when count exceeds 100")
        void capsAlertHistoryExceedingLimit() {
            when(alertMapper.toEntity(any(AlertRequest.class))).thenReturn(alert);
            when(alertRepository.save(any(Alert.class))).thenReturn(alert);
            when(alertMapper.toResponse(any(Alert.class))).thenReturn(response);

            // Mock database having 102 alerts after save
            when(alertRepository.count()).thenReturn(102L);

            // Setup PageRequest and Page content mock
            List<Alert> oldestAlerts = List.of(
                Alert.builder().alertId(10).build(),
                Alert.builder().alertId(11).build()
            );
            org.springframework.data.domain.Page<Alert> mockPage = new org.springframework.data.domain.PageImpl<>(oldestAlerts);
            when(alertRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(mockPage);

            alertService.sendAlert(request);

            verify(alertRepository).deleteAllInBatch(oldestAlerts);
        }
    }
}
