package com.stockpro.supplier.mapper;

import com.stockpro.supplier.dto.request.SupplierRequest;
import com.stockpro.supplier.dto.response.SupplierResponse;
import com.stockpro.supplier.entity.SupplierEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SupplierMapper {

    SupplierResponse toResponse(SupplierEntity supplier);

    @Mapping(target = "supplierId", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "active", ignore = true)
    SupplierEntity toEntity(SupplierRequest request);

    @Mapping(target = "supplierId", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateEntityFromRequest(SupplierRequest request, @MappingTarget SupplierEntity supplier);
}
