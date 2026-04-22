package com.stockpro.product.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer productId;

    @NotBlank(message = "SKU is required")
    @Column(unique = true, nullable = false)
    private String sku;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    private String brand;

    @NotBlank(message = "Unit of measure is required")
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

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    private String barcode;

    // Added to support low-stock query
    @PositiveOrZero(message = "Current quantity cannot be negative")
    private int currentQuantity;
}
