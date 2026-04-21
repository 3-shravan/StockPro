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
public class StockTransferRequest {
    @NotNull(message = "Source warehouse ID is required")
    private Integer fromWarehouseId;

    @NotNull(message = "Destination warehouse ID is required")
    private Integer toWarehouseId;

    @NotNull(message = "Product ID is required")
    private Integer productId;

    @NotNull(message = "Quantity to transfer is required")
    @Positive(message = "Quantity to transfer must be positive")
    private Integer quantity;

    private int managerId;
}
