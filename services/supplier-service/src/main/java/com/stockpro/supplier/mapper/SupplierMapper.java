package com.stockpro.supplier.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SupplierMapper {

    com.stockpro.supplier.dto.response.SupplierResponse toResponse(com.stockpro.supplier.entity.SupplierEntity supplier);

    @Mapping(target = "supplierId", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "active", ignore = true)
    com.stockpro.supplier.entity.SupplierEntity toEntity(com.stockpro.supplier.dto.request.SupplierRequest request);

    @Mapping(target = "supplierId", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateEntityFromRequest(com.stockpro.supplier.dto.request.SupplierRequest request, @MappingTarget com.stockpro.supplier.entity.SupplierEntity supplier);
}
