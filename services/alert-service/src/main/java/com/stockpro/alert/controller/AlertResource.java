package com.stockpro.alert.controller;

import com.stockpro.alert.common.response.ApiResponse;
import com.stockpro.alert.dto.request.AlertRequest;
import com.stockpro.alert.dto.request.BulkAlertRequest;
import com.stockpro.alert.dto.response.AlertResponse;
import com.stockpro.alert.service.AlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;

import java.util.List;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
@Slf4j
public class AlertResource {

  private final AlertService alertService;

  /** Support both targeted and broadcast alerts. */
  @PostMapping
  public ResponseEntity<ApiResponse<AlertResponse>> sendAlert(@Valid @RequestBody AlertRequest request) {
    return ResponseEntity.ok(ApiResponse.success("Alert sent successfully", alertService.sendAlert(request)));
  }

  @GetMapping("/context")
  public ResponseEntity<ApiResponse<List<AlertResponse>>> getByContext(
      @RequestParam int userId,
      @RequestParam String role,
      @RequestParam(required = false) Integer warehouseId) {
    return ResponseEntity.ok(ApiResponse.success("Alerts retrieved successfully",
        alertService.getByContext(userId, role, warehouseId)));
  }

  @GetMapping("/context/unread-count")
  public ResponseEntity<ApiResponse<Integer>> getUnreadCountByContext(
      @RequestParam int userId,
      @RequestParam String role,
      @RequestParam(required = false) Integer warehouseId) {
    return ResponseEntity.ok(ApiResponse.success("Unread count retrieved",
        alertService.getUnreadCountByContext(userId, role, warehouseId)));
  }

  @PostMapping("/low-stock")
  public ResponseEntity<ApiResponse<Void>> sendLowStockAlert(@RequestParam int productId,
      @RequestParam int warehouseId,
      @RequestParam int currentQty) {
    alertService.sendLowStockAlert(productId, warehouseId, currentQty);
    return ResponseEntity.ok(ApiResponse.success("Low-stock alert processed", null));
  }

  @PostMapping("/overstock")
  public ResponseEntity<ApiResponse<Void>> sendOverstockAlert(@RequestParam int productId,
      @RequestParam int warehouseId,
      @RequestParam int currentQty) {
    log.info("API: Processing overstock alert for product {} in warehouse {} (currentQty: {})",
        productId, warehouseId, currentQty);
    alertService.sendOverstockAlert(productId, warehouseId, currentQty);
    return ResponseEntity.ok(ApiResponse.success("Overstock alert processed", null));
  }

  @GetMapping("/recipient/{id}")
  public ResponseEntity<ApiResponse<List<AlertResponse>>> getByRecipient(@PathVariable int id) {
    return ResponseEntity.ok(ApiResponse.success("Alerts retrieved successfully", alertService.getByRecipient(id)));
  }

  @PutMapping("/{id}/read")
  public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable int id) {
    alertService.markAsRead(id);
    return ResponseEntity.ok(ApiResponse.success("Alert marked as read", null));
  }

  @PutMapping("/recipient/{id}/read-all")
  public ResponseEntity<ApiResponse<Void>> markAllRead(@PathVariable int id) {
    alertService.markAllRead(id);
    return ResponseEntity.ok(ApiResponse.success("All alerts marked as read", null));
  }

  @PutMapping("/{id}/acknowledge")
  public ResponseEntity<ApiResponse<Void>> acknowledge(@PathVariable int id, @RequestParam int userId) {
    alertService.acknowledge(id, userId);
    return ResponseEntity.ok(ApiResponse.success("Alert acknowledged", null));
  }

  @GetMapping("/recipient/{id}/unread-count")
  public ResponseEntity<ApiResponse<Integer>> getUnreadCount(@PathVariable int id) {
    return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", alertService.getUnreadCount(id)));
  }

  @GetMapping("/unacknowledged")
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'OFFICER', 'STAFF')")
  public ResponseEntity<ApiResponse<List<AlertResponse>>> getUnacknowledged() {
    log.info("API: Listing unacknowledged alerts");
    List<AlertResponse> alerts = alertService.getUnacknowledged();
    return ResponseEntity.ok(ApiResponse.success("Unacknowledged alerts retrieved", filterAlerts(alerts)));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ApiResponse<Void>> delete(@PathVariable int id) {
    alertService.deleteAlert(id);
    return ResponseEntity.ok(ApiResponse.success("Alert deleted successfully", null));
  }

  @DeleteMapping("/clear-type")
  public ResponseEntity<ApiResponse<Void>> clearByType(@RequestParam String type, @RequestParam int warehouseId) {
    alertService.clearAlertsByTypeAndWarehouse(type, warehouseId);
    return ResponseEntity.ok(ApiResponse.success("Alerts cleared successfully", null));
  }

  /** Only Admins can broadcast system-wide bulk alerts. */
  @PostMapping("/bulk")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ApiResponse<Void>> sendBulk(@Valid @RequestBody BulkAlertRequest request) {
    alertService.sendBulk(request);
    return ResponseEntity.ok(ApiResponse.success("Bulk alerts sent successfully", null));
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OFFICER', 'STAFF')")
  public ResponseEntity<ApiResponse<List<AlertResponse>>> getAll() {
    log.info("API: Listing all alerts");
    List<AlertResponse> alerts = alertService.getAll();
    return ResponseEntity.ok(ApiResponse.success("All alerts retrieved successfully", filterAlerts(alerts)));
  }

  private List<AlertResponse> filterAlerts(List<AlertResponse> alerts) {
    String role = getCurrentUserRole();
    if ("ROLE_ADMIN".equals(role) || "ROLE_OFFICER".equals(role)) {
      return alerts;
    }

    if ("ROLE_MANAGER".equals(role)) {
      int userId = getCurrentUserId();
      List<Integer> managedHubs = getManagedWarehouseIds(userId);
      return alerts.stream()
          .filter(a -> a.getRelatedWarehouseId() == null || managedHubs.contains(a.getRelatedWarehouseId()))
          .toList();
    }

    if ("ROLE_STAFF".equals(role)) {
      String dept = getCurrentUserDepartment();
      Integer warehouseId = resolveWarehouseIdByName(dept);
      return alerts.stream()
          .filter(a -> a.getRelatedWarehouseId() == null
              || (warehouseId != null && a.getRelatedWarehouseId().equals(warehouseId)))
          .toList();
    }

    return List.of();
  }

  private String getCurrentUserRole() {
    return SecurityContextHolder.getContext().getAuthentication()
        .getAuthorities().iterator().next().getAuthority();
  }

  private int getCurrentUserId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getDetails() instanceof java.util.Map details) {
      Object userIdObj = details.get("userId");
      if (userIdObj instanceof Integer) {
        return (Integer) userIdObj;
      } else if (userIdObj instanceof String) {
        try {
          return Integer.parseInt((String) userIdObj);
        } catch (NumberFormatException e) {
          log.error("Failed to parse userId string from details: {}", userIdObj);
        }
      }
    }
    return 0;
  }

  private String getCurrentUserDepartment() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken token) {
      var details = token.getDetails();
      if (details instanceof java.util.Map map) {
        return (String) map.get("department");
      }
    }
    return null;
  }

  @Value("${services.warehouse.url}")
  private String warehouseServiceUrl;

  @Value("${stockpro.security.internal-secret:your_internal_gateway_secret}")
  private String internalGatewaySecret;

  private final org.springframework.web.client.RestTemplate restTemplate;

  private List<Integer> getManagedWarehouseIds(int managerId) {
    try {
      String url = warehouseServiceUrl + "/warehouses";
      HttpHeaders headers = new HttpHeaders();
      headers.set("X-Internal-Gateway-Secret", internalGatewaySecret);
      headers.set("X-User-Name", "system");
      headers.set("X-User-Roles", "ADMIN");
      HttpEntity<Void> entity = new HttpEntity<>(headers);

      ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> res = restTemplate.exchange(url, HttpMethod.GET,
          entity,
          new ParameterizedTypeReference<ApiResponse<List<java.util.Map<String, Object>>>>() {
          });

      if (res.getBody() != null && res.getBody().getData() != null) {
        return res.getBody().getData().stream()
            .filter(w -> {
              Object mId = w.get("managerId");
              return mId instanceof Number && ((Number) mId).intValue() == managerId;
            })
            .map(w -> (Integer) w.get("warehouseId"))
            .toList();
      }
    } catch (Exception e) {
      log.error("Failed to fetch managed warehouses for manager {}: {}", managerId, e.getMessage());
    }
    return List.of();
  }

  private Integer resolveWarehouseIdByName(String name) {
    if (name == null || name.isBlank())
      return null;
    try {
      String url = warehouseServiceUrl + "/warehouses/name/" + name;
      HttpHeaders headers = new HttpHeaders();
      headers.set("X-Internal-Gateway-Secret", internalGatewaySecret);
      HttpEntity<Void> entity = new HttpEntity<>(headers);

      ResponseEntity<ApiResponse<java.util.Map<String, Object>>> res = restTemplate.exchange(url, HttpMethod.GET,
          entity,
          new ParameterizedTypeReference<ApiResponse<java.util.Map<String, Object>>>() {
          });

      if (res.getBody() != null && res.getBody().getData() != null) {
        return (Integer) res.getBody().getData().get("warehouseId");
      }
    } catch (Exception e) {
      log.warn("Failed to resolve warehouse ID for name {}: {}", name, e.getMessage());
    }
    return null;
  }

  @GetMapping("/test-email")
  public ResponseEntity<ApiResponse<String>> testEmail() {
    alertService.sendTestEmail();
    return ResponseEntity
        .ok(ApiResponse.success("Test email dispatch initiated. Check logs and inbox.", "Check your email."));
  }
}
