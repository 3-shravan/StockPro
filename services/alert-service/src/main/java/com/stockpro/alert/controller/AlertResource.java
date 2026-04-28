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

import java.util.List;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
@Slf4j
public class AlertResource {

  private final AlertService alertService;

  @PostMapping
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  public ResponseEntity<ApiResponse<AlertResponse>> sendAlert(@Valid @RequestBody AlertRequest request) {
    return ResponseEntity.ok(ApiResponse.success("Alert sent successfully", alertService.sendAlert(request)));
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
  public ResponseEntity<ApiResponse<Void>> acknowledge(@PathVariable int id) {
    alertService.acknowledge(id);
    return ResponseEntity.ok(ApiResponse.success("Alert acknowledged", null));
  }

  @GetMapping("/recipient/{id}/unread-count")
  public ResponseEntity<ApiResponse<Integer>> getUnreadCount(@PathVariable int id) {
    return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", alertService.getUnreadCount(id)));
  }

  @GetMapping("/unacknowledged")
  @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
  public ResponseEntity<ApiResponse<List<AlertResponse>>> getUnacknowledged() {
    return ResponseEntity.ok(ApiResponse.success("Unacknowledged alerts retrieved", alertService.getUnacknowledged()));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ApiResponse<Void>> delete(@PathVariable int id) {
    alertService.deleteAlert(id);
    return ResponseEntity.ok(ApiResponse.success("Alert deleted successfully", null));
  }

  @PostMapping("/bulk")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ApiResponse<Void>> sendBulk(@Valid @RequestBody BulkAlertRequest request) {
    alertService.sendBulk(request);
    return ResponseEntity.ok(ApiResponse.success("Bulk alerts sent successfully", null));
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ApiResponse<List<AlertResponse>>> getAll() {
    return ResponseEntity.ok(ApiResponse.success("All alerts retrieved successfully", alertService.getAll()));
  }
  
  @GetMapping("/test-email")
  public ResponseEntity<ApiResponse<String>> testEmail() {
    alertService.sendTestEmail();
    return ResponseEntity.ok(ApiResponse.success("Test email dispatch initiated. Check logs and inbox.", "Check your email."));
  }
}
