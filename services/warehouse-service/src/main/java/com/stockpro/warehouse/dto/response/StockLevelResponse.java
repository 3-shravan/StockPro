package com.stockpro.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLevelResponse {
    private int stockId;
    private int warehouseId;
    private int productId;
    private int quantity;
    private int reservedQuantity;
    private int availableQuantity;
    private String location;
    private LocalDateTime lastUpdated;
}
