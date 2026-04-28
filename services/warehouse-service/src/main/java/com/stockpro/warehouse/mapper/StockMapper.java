package com.stockpro.warehouse.mapper;

import org.mapstruct.Mapper;

import com.stockpro.warehouse.dto.response.StockLevelResponse;
import com.stockpro.warehouse.entity.StockLevel;

@Mapper(componentModel = "spring")
public interface StockMapper {

    StockLevelResponse toResponse(StockLevel stockLevel);
}
