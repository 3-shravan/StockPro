package com.stockpro.warehouse.mapper;

import com.stockpro.warehouse.dto.response.StockLevelResponse;
import com.stockpro.warehouse.entity.StockLevel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StockMapper {

    @Mapping(target = "availableQuantity", expression = "java(stockLevel.getAvailableQuantity())")
    StockLevelResponse toResponse(StockLevel stockLevel);
}
