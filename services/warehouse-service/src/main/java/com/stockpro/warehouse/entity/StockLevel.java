package com.stockpro.warehouse.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_levels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stock_id")
    private int stockId;

    @Column(name = "warehouse_id", nullable = false)
    private int warehouseId;

    @Column(name = "product_id", nullable = false)
    private int productId;

    @Column(nullable = false)
    private int quantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    private int reservedQuantity = 0;

    @Column(name = "location")
    private String location;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public int getAvailableQuantity() {
        return this.quantity - this.reservedQuantity;
    }
}
