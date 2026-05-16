package com.stockpro.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponse {
    private int warehouseId;
    private String name;
    private String location;
    private String address;
    private Integer managerId;
    private int capacity;
    private int usedCapacity;
    private boolean active;
    private String phone;
    private LocalDate createdAt;
}
