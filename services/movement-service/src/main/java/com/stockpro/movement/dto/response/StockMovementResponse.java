package com.stockpro.movement.dto.response;

import com.stockpro.movement.entity.MovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementResponse {

  private Integer movementId;
  private Integer productId;
  private Integer warehouseId;
  private MovementType movementType;
  private Integer quantity;
  private Integer referenceId;
  private String referenceType;
  private double unitCost;
  private Integer performedBy;
  private String notes;
  private LocalDateTime movementDate;
  private Integer balanceAfter;
}
