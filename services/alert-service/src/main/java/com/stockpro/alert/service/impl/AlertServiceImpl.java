package com.stockpro.alert.service.impl;

import java.time.LocalDateTime;

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
import com.stockpro.alert.service.AlertService;
import com.stockpro.alert.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertServiceImpl implements AlertService {

  private final AlertRepository alertRepository;
  private final AlertMapper alertMapper;
  private final JavaMailSender emailSender;
  private final RestTemplate restTemplate;

  @Value("${services.product.url:http://localhost:8082}")
  private String productServiceUrl;

  @Value("${services.warehouse.url:http://localhost:8083}")
  private String warehouseServiceUrl;

  @Value("${services.auth.url:http://localhost:8081}")
  private String authServiceUrl;

  @Value("${services.supplier.url:http://localhost:8085}")
  private String supplierServiceUrl;

  @Value("${alert.default.email.to:alerts@stockpro.local}")
  private String defaultEmailTo;

  @Value("${spring.mail.from:noreply@stockpro.local}")
  private String emailFrom;

  @Override
  @Transactional
  public AlertResponse sendAlert(AlertRequest alertRequest) {
    Alert alert = alertMapper.toEntity(alertRequest);
    Alert saved = alertRepository.save(alert);

    if (saved.getSeverity() == AlertSeverity.CRITICAL
        && (saved.getChannel() == AlertChannel.EMAIL || saved.getChannel() == AlertChannel.BOTH)) {
      sendEmail(defaultEmailTo, "CRITICAL: " + saved.getTitle(), saved.getMessage());
    }

    return alertMapper.toResponse(saved);
  }

  @Override
  @Transactional
  public void sendLowStockAlert(int productId, int warehouseId, int currentQty) {
    String productName = getProductName(productId);
    String warehouseName = getWarehouseName(warehouseId);

    AlertSeverity severity = currentQty <= 5 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
    AlertChannel channel = severity == AlertSeverity.CRITICAL ? AlertChannel.BOTH : AlertChannel.IN_APP;

    List<Integer> recipients = getAdminAndManagerIds();
    if (recipients.isEmpty()) {
      recipients = List.of(1); // Fallback to system admin
    }

    for (Integer recipientId : recipients) {
      Alert alert = Alert.builder()
          .recipientId(recipientId)
          .type(AlertType.LOW_STOCK)
          .severity(severity)
          .title("Low Stock: " + productName)
          .message(String.format("Product '%s' in warehouse '%s' has low stock. Current quantity: %d",
              productName, warehouseName, currentQty))
          .relatedProductId(productId)
          .relatedWarehouseId(warehouseId)
          .channel(channel)
          .build();

      alertRepository.save(alert);
    }

    if (severity == AlertSeverity.CRITICAL) {
      sendEmail(defaultEmailTo, "CRITICAL LOW STOCK: " + productName,
          String.format("Low stock warning for %s in %s. Only %d units left.", productName, warehouseName, currentQty));
    }
  }

  @Override
  @Transactional
  public void sendOverstockAlert(int productId, int warehouseId, int currentQty) {
    String productName = getProductName(productId);
    String warehouseName = getWarehouseName(warehouseId);

    List<Integer> recipients = getAdminAndManagerIds();
    if (recipients.isEmpty()) {
      recipients = List.of(1);
    }

    for (Integer recipientId : recipients) {
      Alert alert = Alert.builder()
          .recipientId(recipientId)
          .type(AlertType.OVERSTOCK)
          .severity(AlertSeverity.WARNING)
          .title("Overstock: " + productName)
          .message(String.format("Product '%s' in warehouse '%s' is overstocked. Current quantity: %d",
              productName, warehouseName, currentQty))
          .relatedProductId(productId)
          .relatedWarehouseId(warehouseId)
          .channel(AlertChannel.IN_APP)
          .build();

      alertRepository.save(alert);
    }
  }

  @Override
  @Transactional
  public void sendOverduePoAlert(int poId, int supplierId, String referenceNumber) {
    String supplierName = getSupplierName(supplierId);

    List<Integer> recipients = getAdminAndManagerIds();
    if (recipients.isEmpty()) {
      recipients = List.of(1);
    }

    for (Integer recipientId : recipients) {
      Alert alert = Alert.builder()
          .recipientId(recipientId)
          .type(AlertType.OVERDUE_RECEIPT)
          .severity(AlertSeverity.CRITICAL)
          .title("Overdue PO: " + referenceNumber)
          .message(String.format("Purchase Order %s from supplier '%s' is overdue.", referenceNumber, supplierName))
          .channel(AlertChannel.BOTH)
          .build();

      alertRepository.save(alert);
    }

    sendEmail(defaultEmailTo, "CRITICAL OVERDUE PO: " + referenceNumber,
        String.format("PO %s from %s is past its expected delivery date.", referenceNumber, supplierName));
  }

  @Override
  @Transactional
  public void sendBulk(BulkAlertRequest request) {
    AlertSeverity severity = parseSeverity(request.getSeverity());
    AlertType type = parseType(request.getType());
    AlertChannel channel = parseChannel(request.getChannel());

    List<Alert> alerts = request.getRecipientIds().stream()
        .map(recipientId -> Alert.builder()
            .recipientId(recipientId)
            .type(type)
            .severity(severity)
            .title(request.getTitle())
            .message(request.getMessage())
            .relatedProductId(request.getRelatedProductId())
            .relatedWarehouseId(request.getRelatedWarehouseId())
            .channel(channel)
            .build())
        .toList();

    alertRepository.saveAll(alerts);

    if (severity == AlertSeverity.CRITICAL && (channel == AlertChannel.EMAIL || channel == AlertChannel.BOTH)) {
      sendEmail(defaultEmailTo, "CRITICAL BULK ALERT: " + request.getTitle(), request.getMessage());
    }
  }

  @Override
  @Transactional
  public void markAsRead(int alertId) {
    Alert alert = findByIdOrThrow(alertId);
    alert.setRead(true);
    alertRepository.save(alert);
  }

  @Override
  @Transactional
  public void markAllRead(int recipientId) {
    List<Alert> alerts = alertRepository.findByRecipientIdAndRead(recipientId, false);
    alerts.forEach(alert -> alert.setRead(true));
    alertRepository.saveAll(alerts);
  }

  @Override
  @Transactional
  public void acknowledge(int alertId, int userId) {
    Alert alert = findByIdOrThrow(alertId);
    alert.setAcknowledged(true);
    alert.setAcknowledgedBy(userId);
    alert.setAcknowledgedAt(LocalDateTime.now());
    alertRepository.save(alert);
  }

  @Override
  public List<AlertResponse> getByRecipient(int recipientId) {
    return alertRepository.findByRecipientId(recipientId).stream()
        .map(alertMapper::toResponse)
        .map(this::enrich)
        .toList();
  }

  @Override
  public int getUnreadCount(int recipientId) {
    return alertRepository.countByRecipientIdAndRead(recipientId, false);
  }

  @Override
  public List<AlertResponse> getUnacknowledged() {
    return alertRepository.findUnacknowledged().stream()
        .map(alertMapper::toResponse)
        .map(this::enrich)
        .toList();
  }

  @Override
  @Transactional
  public void deleteAlert(int alertId) {
    if (!alertRepository.existsById(alertId)) {
      throw new CustomException("Alert not found with ID: " + alertId, HttpStatus.NOT_FOUND);
    }
    alertRepository.deleteByAlertId(alertId);
  }

  @Override
  @Transactional
  public void clearAlertsByTypeAndWarehouse(String type, int warehouseId) {
    log.info("Clearing alerts of type {} for warehouse {}", type, warehouseId);
    alertRepository.deleteByTypeAndRelatedWarehouseId(parseType(type), warehouseId);
  }

  @Override
  public void sendEmail(String toEmail, String subject, String body) {
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(emailFrom);
      message.setTo(toEmail);
      message.setSubject(subject);
      message.setText(body);
      emailSender.send(message);
      log.info("Alert email dispatched to {}", toEmail);
    } catch (Exception ex) {
      log.warn("Email dispatch failed: {}", ex.getMessage());
    }
  }

  @Override
  public void sendTestEmail() {
    sendEmail(defaultEmailTo, "TEST ALERT: Connection Verification",
        "This is a test email to verify that the StockPro Alert Service mail configuration is working correctly.");
  }

  @Override
  public List<AlertResponse> getAll() {
    return alertRepository.findAll().stream()
        .map(alertMapper::toResponse)
        .map(this::enrich)
        .toList();
  }

  private AlertResponse enrich(AlertResponse response) {
    if (response.isAcknowledged() && response.getAcknowledgedBy() != null) {
      response.setAcknowledgedByName(getUserName(response.getAcknowledgedBy()));
    }
    return response;
  }

  private String getUserName(int userId) {
    try {
      String url = authServiceUrl + "/auth/users/" + userId;
      ResponseEntity<ApiResponse<Map<String, Object>>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
      );
      ApiResponse<Map<String, Object>> apiResponse = response.getBody();
      if (apiResponse != null && apiResponse.getData() != null) {
        Map<String, Object> data = apiResponse.getData();
        return (String) data.get("fullName");
      }
    } catch (Exception e) {
      log.warn("Failed to fetch user name for ID {}: {}", userId, e.getMessage());
    }
    return "User #" + userId;
  }

  private String getProductName(int productId) {
    try {
      String url = productServiceUrl + "/products/" + productId;
      ResponseEntity<ApiResponse<Map<String, Object>>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
      );
      ApiResponse<Map<String, Object>> apiResponse = response.getBody();
      if (apiResponse != null && apiResponse.getData() != null) {
        Map<String, Object> data = apiResponse.getData();
        return (String) data.get("name");
      }
    } catch (Exception e) {
      log.warn("Failed to fetch product name for ID {}: {}", productId, e.getMessage());
    }
    return "Product #" + productId;
  }

  private String getWarehouseName(int warehouseId) {
    try {
      String url = warehouseServiceUrl + "/warehouses/" + warehouseId;
      ResponseEntity<ApiResponse<Map<String, Object>>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
      );
      ApiResponse<Map<String, Object>> apiResponse = response.getBody();
      if (apiResponse != null && apiResponse.getData() != null) {
        Map<String, Object> data = apiResponse.getData();
        return (String) data.get("name");
      }
    } catch (Exception e) {
      log.warn("Failed to fetch warehouse name for ID {}: {}", warehouseId, e.getMessage());
    }
    return "Warehouse #" + warehouseId;
  }

  private String getSupplierName(int supplierId) {
    try {
      String url = supplierServiceUrl + "/suppliers/" + supplierId;
      
      ResponseEntity<ApiResponse<Map<String, Object>>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {}
      );

      ApiResponse<Map<String, Object>> apiResponse = response.getBody();
      if (apiResponse != null && apiResponse.getData() != null) {
        Map<String, Object> data = apiResponse.getData();
        return (String) data.get("name");
      }
    } catch (Exception e) {
      log.warn("Failed to fetch supplier name for ID {}: {}", supplierId, e.getMessage());
    }
    return "Supplier #" + supplierId;
  }

  private List<Integer> getAdminAndManagerIds() {
    try {
      String url = authServiceUrl + "/auth/users";
      
      ResponseEntity<ApiResponse<List<Map<String, Object>>>> response = restTemplate.exchange(
          url,
          HttpMethod.GET,
          null,
          new ParameterizedTypeReference<ApiResponse<List<Map<String, Object>>>>() {}
      );

      ApiResponse<List<Map<String, Object>>> apiResponse = response.getBody();
      if (apiResponse != null && apiResponse.getData() != null) {
        List<Map<String, Object>> users = apiResponse.getData();
        return users.stream()
            .filter(u -> "ADMIN".equals(u.get("role")) || "MANAGER".equals(u.get("role")) || "STAFF".equals(u.get("role")))
            .map(u -> (Integer) u.get("userId"))
            .toList();
      }
    } catch (Exception e) {
      log.warn("Failed to fetch admin/manager IDs: {}", e.getMessage());
    }
    return List.of();
  }

  private Alert findByIdOrThrow(int alertId) {
    return alertRepository.findById(alertId)
        .orElseThrow(() -> new CustomException("Alert not found with ID: " + alertId, HttpStatus.NOT_FOUND));
  }

  private AlertType parseType(String type) {
    try {
      return AlertType.valueOf(type.trim().toUpperCase());
    } catch (Exception ex) {
      throw new CustomException("Invalid type: " + type, HttpStatus.BAD_REQUEST);
    }
  }

  private AlertSeverity parseSeverity(String severity) {
    try {
      return AlertSeverity.valueOf(severity.trim().toUpperCase());
    } catch (Exception ex) {
      throw new CustomException("Invalid severity: " + severity, HttpStatus.BAD_REQUEST);
    }
  }

  private AlertChannel parseChannel(String channel) {
    try {
      return AlertChannel.valueOf(channel.trim().toUpperCase());
    } catch (Exception ex) {
      throw new CustomException("Invalid channel: " + channel, HttpStatus.BAD_REQUEST);
    }
  }
}
