package com.stockpro.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ProductResponse — secure DTO for outgoing product data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Integer productId;
    private String sku;
    private String name;
    private String description;
    private String category;
    private String brand;
    private String unitOfMeasure;
    private double costPrice;
    private double sellingPrice;
    private int reorderLevel;
    private int maxStockLevel;
    private int leadTimeDays;
    private String imageUrl;
    private String barcode;
    private int currentQuantity;
    private boolean active;
}
