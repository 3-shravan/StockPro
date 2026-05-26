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

  @Value("${stockpro.security.internal-secret:your_internal_gateway_secret}")
  private String internalGatewaySecret;

  @Override
  @Transactional
  public AlertResponse sendAlert(AlertRequest alertRequest) {
    Alert alert = alertMapper.toEntity(alertRequest);
    Alert saved = alertRepository.save(alert);

    capAlertsCount();

    if (saved.getSeverity() == AlertSeverity.CRITICAL
        && (saved.getChannel() == AlertChannel.EMAIL || saved.getChannel() == AlertChannel.BOTH)) {
      sendEmail(defaultEmailTo, "CRITICAL: " + saved.getTitle(), saved.getMessage());
    }

    return alertMapper.toResponse(saved);
  }

  @Override
  @Transactional
  public void sendLowStockAlert(int productId, int warehouseId, int currentQty) {
    if (alertRepository.existsByTypeAndRelatedProductIdAndRelatedWarehouseIdAndAcknowledgedFalse(
        AlertType.LOW_STOCK, productId, warehouseId)) {
      log.info("Low stock alert already exists and is unacknowledged for product {} in warehouse {}. Skipping.",
          productId, warehouseId);
      return;
    }

    String productName = getProductName(productId);
    String warehouseName = getWarehouseName(warehouseId);

    AlertSeverity severity = currentQty <= 5 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
    AlertChannel channel = severity == AlertSeverity.CRITICAL ? AlertChannel.BOTH : AlertChannel.IN_APP;

    // Use Broadcasting instead of individual alerts
    Alert alert = Alert.builder()
        .targetRole("MANAGER")
        .targetWarehouseId(warehouseId)
        .type(AlertType.LOW_STOCK)
        .severity(severity)
        .title("Low Stock: " + productName)
        .message(String.format("Product '%s' in warehouse '%s' has low stock. Current quantity: %d",
            productName, warehouseName, currentQty))
        .relatedProductId(productId)
        .relatedWarehouseId(warehouseId)
        .channel(channel)
        .build();

    try {
      alertRepository.save(alert);
    } catch (Exception e) {
      log.error("Failed to save MANAGER low-stock alert: {}", e.getMessage());
      throw e;
    }

    // Also notify Admin globally
    Alert adminAlert = Alert.builder()
        .targetRole("ADMIN")
        .type(AlertType.LOW_STOCK)
        .severity(severity)
        .title("Network Low Stock: " + productName)
        .message(String.format("Low stock event at %s for %s. Density: %d", warehouseName, productName, currentQty))
        .relatedProductId(productId)
        .relatedWarehouseId(warehouseId)
        .channel(channel)
        .build();

    try {
      alertRepository.save(adminAlert);
    } catch (Exception e) {
      log.error("Failed to save ADMIN low-stock alert: {}", e.getMessage());
      throw e;
    }

    capAlertsCount();

    if (severity == AlertSeverity.CRITICAL) {
      sendEmailToRole("MANAGER", warehouseId, "CRITICAL LOW STOCK: " + productName,
          String.format("Low stock warning for %s in %s. Only %d units left.", productName, warehouseName, currentQty));
      sendEmailToRole("ADMIN", null, "CRITICAL LOW STOCK: " + productName,
          String.format("Network-wide low stock event: %s in %s. Only %d units left.", productName, warehouseName,
              currentQty));
    }
  }

  @Override
  @Transactional
  public void sendOverstockAlert(int productId, int warehouseId, int currentQty) {
    if (alertRepository.existsByTypeAndRelatedProductIdAndRelatedWarehouseIdAndAcknowledgedFalse(
        AlertType.OVERSTOCK, productId, warehouseId)) {
      log.info("Overstock alert already exists and is unacknowledged for product {} in warehouse {}. Skipping.",
          productId, warehouseId);
      return;
    }

    String productName = getProductName(productId);
    String warehouseName = getWarehouseName(warehouseId);

    Alert alert = Alert.builder()
        .targetRole("MANAGER")
        .targetWarehouseId(warehouseId)
        .type(AlertType.OVERSTOCK)
        .severity(AlertSeverity.WARNING)
        .title("Overstock: " + productName)
        .message(String.format("Product '%s' in warehouse '%s' is overstocked. Current quantity: %d",
            productName, warehouseName, currentQty))
        .relatedProductId(productId)
        .relatedWarehouseId(warehouseId)
        .channel(AlertChannel.IN_APP)
        .build();

    try {
      alertRepository.save(alert);
    } catch (Exception e) {
      log.error("Failed to save MANAGER overstock alert: {}", e.getMessage());
      throw e;
    }

    // Also notify Admin globally
    Alert adminAlert = Alert.builder()
        .targetRole("ADMIN")
        .type(AlertType.OVERSTOCK)
        .severity(AlertSeverity.WARNING)
        .title("Network Overstock: " + productName)
        .message(String.format("Overstock event at %s for %s. Density: %d", warehouseName, productName, currentQty))
        .relatedProductId(productId)
        .relatedWarehouseId(warehouseId)
        .channel(AlertChannel.IN_APP)
        .build();

    try {
      alertRepository.save(adminAlert);
      log.info("Overstock alerts broadcasted to MANAGER and ADMIN for product {}", productId);
    } catch (Exception e) {
      log.error("Failed to save ADMIN overstock alert: {}", e.getMessage());
      throw e;
    }

    capAlertsCount();
  }

  @Override
  @Transactional
  public void sendOverduePoAlert(int poId, int supplierId, String referenceNumber) {
    String supplierName = getSupplierName(supplierId);

    // Broadcast to Admins and Managers
    Alert managerAlert = Alert.builder()
        .targetRole("MANAGER")
        .type(AlertType.OVERDUE_RECEIPT)
        .severity(AlertSeverity.CRITICAL)
        .title("Overdue PO: " + referenceNumber)
        .message(String.format("Purchase Order %s from supplier '%s' is overdue.", referenceNumber, supplierName))
        .channel(AlertChannel.BOTH)
        .build();
    alertRepository.save(managerAlert);

    Alert adminAlert = Alert.builder()
        .targetRole("ADMIN")
        .type(AlertType.OVERDUE_RECEIPT)
        .severity(AlertSeverity.CRITICAL)
        .title("Network Alert: Overdue PO " + referenceNumber)
        .message(String.format("PO %s from %s is past its expected delivery date.", referenceNumber, supplierName))
        .channel(AlertChannel.BOTH)
        .build();
    alertRepository.save(adminAlert);

    capAlertsCount();

    sendEmailToRole("MANAGER", null, "CRITICAL OVERDUE PO: " + referenceNumber,
        String.format("PO %s from %s is past its expected delivery date.", referenceNumber, supplierName));
    sendEmailToRole("ADMIN", null, "CRITICAL OVERDUE PO: " + referenceNumber,
        String.format("Network-wide PO delay: %s from %s.", referenceNumber, supplierName));
  }

  private void sendEmailToRole(String role, Integer warehouseId, String subject, String body) {
    try {
      String url = authServiceUrl + "/auth/users";

      // Add internal security headers
      org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
      headers.set("X-Internal-Gateway-Secret", internalGatewaySecret);
      headers.set("X-User-Roles", "ADMIN"); // Act as admin for user lookup
      org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

      ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> response = restTemplate.exchange(
          url, HttpMethod.GET, entity,
          new ParameterizedTypeReference<ApiResponse<List<java.util.Map<String, Object>>>>() {
          });

      if (response.getBody() != null && response.getBody().getData() != null) {
        List<java.util.Map<String, Object>> users = response.getBody().getData();
        users.stream()
            .filter(u -> role.equals(u.get("role")))
            .filter(u -> warehouseId == null || warehouseId.equals(u.get("warehouseId")))
            .map(u -> (String) u.get("email"))
            .filter(email -> email != null && !email.isBlank())
            .forEach(email -> sendEmail(email, subject, body));
      }
    } catch (Exception e) {
      log.warn("Failed to dispatch role-based emails for {}: {}", role, e.getMessage());
    }
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

    capAlertsCount();

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
  public List<AlertResponse> getByContext(int userId, String role, Integer warehouseId) {
    return alertRepository.findByTargetContext(userId, role, warehouseId).stream()
        .map(alertMapper::toResponse)
        .map(this::enrich)
        .toList();
  }

  @Override
  public int getUnreadCount(int recipientId) {
    return alertRepository.countByRecipientIdAndRead(recipientId, false);
  }

  @Override
  public int getUnreadCountByContext(int userId, String role, Integer warehouseId) {
    return alertRepository.countUnreadByTargetContext(userId, role, warehouseId);
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
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {
          });
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
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {
          });
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
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {
          });
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
          new ParameterizedTypeReference<ApiResponse<Map<String, Object>>>() {
          });

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

  private void capAlertsCount() {
    long count = alertRepository.count();
    if (count > 100) {
      int excess = (int) (count - 100);
      org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, excess,
          org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "createdAt",
              "alertId"));
      List<Alert> oldestAlerts = alertRepository.findAll(pageable).getContent();
      alertRepository.deleteAllInBatch(oldestAlerts);
      log.info("Capped alerts count. Deleted {} oldest alerts.", excess);
    }
  }

  @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  @Transactional
  public void onApplicationReady() {
    log.info("Application ready. Running startup alert capping check...");
    capAlertsCount();
  }
}
