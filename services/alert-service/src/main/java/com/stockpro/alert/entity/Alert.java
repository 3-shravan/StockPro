package com.stockpro.alert.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer alertId;

  @NotNull(message = "recipientId is required")
  @Column(nullable = false)
  private Integer recipientId;

  @NotNull(message = "type is required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private AlertType type;

  @NotNull(message = "severity is required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AlertSeverity severity;

  @NotBlank(message = "title is required")
  @Column(nullable = false, length = 200)
  private String title;

  @NotBlank(message = "message is required")
  @Column(nullable = false, length = 2000)
  private String message;

  private Integer relatedProductId;

  private Integer relatedWarehouseId;

  @NotNull(message = "channel is required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AlertChannel channel;

  @Builder.Default
  @Column(name = "is_read", nullable = false)
  private boolean read = false;

  @Builder.Default
  @Column(name = "is_acknowledged", nullable = false)
  private boolean acknowledged = false;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }
}
