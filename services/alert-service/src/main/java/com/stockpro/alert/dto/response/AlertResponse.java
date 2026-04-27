package com.stockpro.alert.dto.response;

import com.stockpro.alert.entity.AlertChannel;
import com.stockpro.alert.entity.AlertSeverity;
import com.stockpro.alert.entity.AlertType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertResponse {

  private Integer alertId;
  private Integer recipientId;
  private AlertType type;
  private AlertSeverity severity;
  private String title;
  private String message;
  private Integer relatedProductId;
  private Integer relatedWarehouseId;
  private AlertChannel channel;
  private boolean read;
  private boolean acknowledged;
  private LocalDateTime createdAt;
}
