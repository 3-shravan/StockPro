package com.stockpro.alert.repository;

import com.stockpro.alert.entity.Alert;
import com.stockpro.alert.entity.AlertSeverity;
import com.stockpro.alert.entity.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Integer> {

  @Query("SELECT a FROM Alert a WHERE a.recipientId = :userId OR " +
         "(a.targetRole = :role AND (a.targetWarehouseId IS NULL OR a.targetWarehouseId = :warehouseId)) " +
         "ORDER BY a.createdAt DESC")
  List<Alert> findByTargetContext(int userId, String role, Integer warehouseId);

  @Query("SELECT COUNT(a) FROM Alert a WHERE (a.recipientId = :userId OR " +
         "(a.targetRole = :role AND (a.targetWarehouseId IS NULL OR a.targetWarehouseId = :warehouseId))) " +
         "AND a.read = false")
  int countUnreadByTargetContext(int userId, String role, Integer warehouseId);

  List<Alert> findByRecipientId(int recipientId);

  List<Alert> findByRecipientIdAndRead(int recipientId, boolean read);

  int countByRecipientIdAndRead(int recipientId, boolean read);

  List<Alert> findByType(AlertType type);

  List<Alert> findBySeverity(AlertSeverity severity);

  List<Alert> findByRelatedProductId(int productId);

  @Query("SELECT a FROM Alert a WHERE a.acknowledged = false ORDER BY a.createdAt DESC")
  List<Alert> findUnacknowledged();

  void deleteByTypeAndRelatedWarehouseId(AlertType type, Integer relatedWarehouseId);

  void deleteByAlertId(int alertId);
}
