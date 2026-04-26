package com.stockpro.movement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementRequest {

  @NotNull(message = "productId is required")
  private Integer productId;

  @NotNull(message = "warehouseId is required")
  private Integer warehouseId;

  @NotBlank(message = "movementType is required")
  private String movementType;

  @Positive(message = "quantity must be greater than 0")
  private Integer quantity;

  @NotNull(message = "referenceId is required")
  private Integer referenceId;

  @NotBlank(message = "referenceType is required")
  private String referenceType;

  @PositiveOrZero(message = "unitCost cannot be negative")
  private double unitCost;

  @NotNull(message = "performedBy is required")
  private Integer performedBy;

  private String notes;

  @NotNull(message = "balanceAfter is required")
  private Integer balanceAfter;
}
