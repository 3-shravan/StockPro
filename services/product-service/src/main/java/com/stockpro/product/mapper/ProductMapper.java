package com.stockpro.product.mapper;

import com.stockpro.product.dto.request.ProductRequest;
import com.stockpro.product.dto.response.ProductResponse;
import com.stockpro.product.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "active", constant = "true")
    Product toEntity(ProductRequest request);

    ProductResponse toResponse(Product product);

    @Mapping(target = "productId", ignore = true)
    @Mapping(target = "sku", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateEntityFromRequest(ProductRequest request, @MappingTarget Product entity);
}
