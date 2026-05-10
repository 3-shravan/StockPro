package com.stockpro.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStatsResponse {
    private int warehouseId;
    private String warehouseName;
    private int totalItems;
    private int uniqueProducts;
    private int capacity;
    private int usedCapacity;
    private double utilizedPercentage;
    private int lowStockItems;
    private List<ProductStockStat> topProducts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductStockStat {
        private int productId;
        private String productName;
        private int quantity;
    }
}
