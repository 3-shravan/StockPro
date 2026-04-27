package com.stockpro.alert.repository;

import com.stockpro.alert.entity.Alert;
import com.stockpro.alert.entity.AlertSeverity;
import com.stockpro.alert.entity.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Integer> {

  List<Alert> findByRecipientId(int recipientId);

  List<Alert> findByRecipientIdAndRead(int recipientId, boolean read);

  int countByRecipientIdAndRead(int recipientId, boolean read);

  List<Alert> findByType(AlertType type);

  List<Alert> findBySeverity(AlertSeverity severity);

  List<Alert> findByRelatedProductId(int productId);

  @Query("SELECT a FROM Alert a WHERE a.acknowledged = false ORDER BY a.createdAt DESC")
  List<Alert> findUnacknowledged();

  void deleteByAlertId(int alertId);
}
