package com.stockpro.warehouse.mapper;

import com.stockpro.warehouse.entity.Warehouse;
import com.stockpro.warehouse.dto.response.WarehouseResponse;
import com.stockpro.warehouse.dto.request.WarehouseRequest;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

/**
 * WarehouseMapper handles the transformation between Warehouse entities and their DTOs.
 * 
 * Why: We are using a manual implementation instead of MapStruct here because of persistent
 * annotation processor issues (NoClassDefFoundError/erroneous element null) in the 
 * warehouse-service build environment.
 */
@Component
public class WarehouseMapper {

    public WarehouseResponse toResponse(Warehouse warehouse) {
        if (warehouse == null) return null;

        return WarehouseResponse.builder()
                .warehouseId(warehouse.getWarehouseId())
                .name(warehouse.getName())
                .location(warehouse.getLocation())
                .address(warehouse.getAddress())
                .managerId(warehouse.getManagerId())
                .capacity(warehouse.getCapacity())
                .usedCapacity(warehouse.getUsedCapacity())
                .active(warehouse.isActive())
                .phone(warehouse.getPhone())
                .createdAt(warehouse.getCreatedAt())
                .build();
    }

    public Warehouse toEntity(WarehouseRequest request) {
        if (request == null) return null;

        return Warehouse.builder()
                .name(request.getName())
                .location(request.getLocation())
                .address(request.getAddress())
                .managerId(request.getManagerId())
                .capacity(request.getCapacity())
                .active(request.isActive())
                .phone(request.getPhone())
                .createdAt(LocalDate.now())
                .build();
    }

    public void updateEntity(WarehouseRequest request, Warehouse warehouse) {
        if (request == null || warehouse == null) return;

        warehouse.setName(request.getName());
        warehouse.setLocation(request.getLocation());
        warehouse.setAddress(request.getAddress());
        warehouse.setManagerId(request.getManagerId());
        warehouse.setCapacity(request.getCapacity());
        warehouse.setActive(request.isActive());
        warehouse.setPhone(request.getPhone());
    }
}
