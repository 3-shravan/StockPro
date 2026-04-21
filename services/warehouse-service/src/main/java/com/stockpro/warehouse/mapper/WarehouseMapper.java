package com.stockpro.warehouse.mapper;

import com.stockpro.warehouse.dto.request.WarehouseRequest;
import com.stockpro.warehouse.dto.response.WarehouseResponse;
import com.stockpro.warehouse.entity.Warehouse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface WarehouseMapper {

    WarehouseResponse toResponse(Warehouse warehouse);

    @Mapping(target = "warehouseId", ignore = true)
    @Mapping(target = "usedCapacity", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Warehouse toEntity(WarehouseRequest request);

    @Mapping(target = "warehouseId", ignore = true)
    @Mapping(target = "usedCapacity", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntity(WarehouseRequest request, @MappingTarget Warehouse warehouse);
}
