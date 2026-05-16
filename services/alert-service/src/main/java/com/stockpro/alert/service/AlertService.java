package com.stockpro.alert.service;

import com.stockpro.alert.dto.request.AlertRequest;
import com.stockpro.alert.dto.request.BulkAlertRequest;
import com.stockpro.alert.dto.response.AlertResponse;

import java.util.List;

public interface AlertService {

  AlertResponse sendAlert(AlertRequest alertRequest);

  void sendLowStockAlert(int productId, int warehouseId, int currentQty);

  void sendOverstockAlert(int productId, int warehouseId, int currentQty);

  void sendBulk(BulkAlertRequest request);

  void markAsRead(int alertId);

  void markAllRead(int recipientId);

  void acknowledge(int alertId, int userId);

  List<AlertResponse> getByRecipient(int recipientId);

  List<AlertResponse> getByContext(int userId, String role, Integer warehouseId);

  int getUnreadCount(int recipientId);

  int getUnreadCountByContext(int userId, String role, Integer warehouseId);

  List<AlertResponse> getUnacknowledged();

  void deleteAlert(int alertId);

  void sendEmail(String toEmail, String subject, String body);

  void sendOverduePoAlert(int poId, int supplierId, String referenceNumber);
  
  void sendTestEmail();

  void clearAlertsByTypeAndWarehouse(String type, int warehouseId);

  List<AlertResponse> getAll();
}
