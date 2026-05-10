package com.stockpro.warehouse.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
