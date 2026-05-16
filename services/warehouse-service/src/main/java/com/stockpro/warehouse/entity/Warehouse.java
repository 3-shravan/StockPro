package com.stockpro.warehouse.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "warehouses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warehouse_id")
    private int warehouseId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String address;

    @Column(name = "manager_id")
    private Integer managerId;

    @Column(nullable = false)
    private int capacity;

    @Column(name = "used_capacity")
    private int usedCapacity;

    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    private String phone;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDate createdAt = LocalDate.now();
}
