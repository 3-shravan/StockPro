package com.stockpro.movement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer movementId;

  @NotNull(message = "productId is required")
  @Column(nullable = false)
  private Integer productId;

  @NotNull(message = "warehouseId is required")
  @Column(nullable = false)
  private Integer warehouseId;

  @NotNull(message = "movementType is required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private MovementType movementType;

  @Positive(message = "quantity must be greater than 0")
  @Column(nullable = false)
  private Integer quantity;

  @NotNull(message = "referenceId is required")
  @Column(nullable = false)
  private Integer referenceId;

  @NotBlank(message = "referenceType is required")
  @Column(nullable = false, length = 50)
  private String referenceType;

  @PositiveOrZero(message = "unitCost cannot be negative")
  @Column(nullable = false)
  private double unitCost;

  @NotNull(message = "performedBy is required")
  @Column(nullable = false)
  private Integer performedBy;

  @Column(length = 2000)
  private String notes;

  @Column(nullable = false, updatable = false)
  private LocalDateTime movementDate;

  @Column(name = "product_name")
  private String productName;

  @Column(name = "warehouse_name")
  private String warehouseName;

  @NotNull(message = "balanceAfter is required")
  @Column(nullable = false)
  private Integer balanceAfter;

  @PrePersist
  public void prePersist() {
    if (movementDate == null) {
      movementDate = LocalDateTime.now();
    }
  }
}
