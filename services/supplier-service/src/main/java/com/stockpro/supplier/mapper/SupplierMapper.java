package com.stockpro.supplier.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.stockpro.supplier.dto.request.SupplierRequest;
import com.stockpro.supplier.dto.response.SupplierResponse;
import com.stockpro.supplier.entity.Supplier;

@Mapper(componentModel = "spring")
public interface SupplierMapper {

    @Mapping(source = "active", target = "isActive")
    SupplierResponse toResponse(Supplier supplier);

    @Mapping(target = "supplierId", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "active", ignore = true)
    Supplier toEntity(SupplierRequest request);

    @Mapping(target = "supplierId", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateEntityFromRequest(SupplierRequest request, @MappingTarget Supplier supplier);
}
