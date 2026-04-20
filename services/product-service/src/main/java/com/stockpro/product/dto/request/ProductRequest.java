package com.stockpro.product.dto.request;

import com.stockpro.product.validation.ValidationGroups;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ProductRequest — DTO for creating and updating products.
 * Uses Validation Groups to handle different mandatory requirements.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "SKU is required", groups = ValidationGroups.OnCreate.class)
    private String sku;

    @NotBlank(message = "Name is required", groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private String name;

    private String description;

    @NotBlank(message = "Category is required", groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private String category;

    private String brand;

    @NotBlank(message = "Unit of measure is required", groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private String unitOfMeasure;

    @PositiveOrZero(message = "Cost price cannot be negative")
    private double costPrice;

    @PositiveOrZero(message = "Selling price cannot be negative")
    private double sellingPrice;

    @PositiveOrZero(message = "Reorder level cannot be negative")
    private int reorderLevel;

    @PositiveOrZero(message = "Max stock level cannot be negative")
    private int maxStockLevel;

    @PositiveOrZero(message = "Lead time days cannot be negative")
    private int leadTimeDays;

    private String imageUrl;
    private String barcode;

    @PositiveOrZero(message = "Current quantity cannot be negative")
    private int currentQuantity;
}
