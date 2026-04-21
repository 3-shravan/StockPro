package com.stockpro.warehouse.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservationRequest {
    @NotNull(message = "Warehouse ID is required")
    private Integer warehouseId;

    @NotNull(message = "Product ID is required")
    private Integer productId;

    @NotNull(message = "Quantity to reserve is required")
    @Positive(message = "Quantity to reserve must be positive")
    private Integer quantity;
}
