package com.stockpro.movement.mapper;

import com.stockpro.movement.dto.request.StockMovementRequest;
import com.stockpro.movement.dto.response.StockMovementResponse;
import com.stockpro.movement.entity.StockMovement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MovementMapper {

  @Mapping(target = "movementId", ignore = true)
  @Mapping(target = "movementDate", ignore = true)
  @Mapping(target = "movementType", expression = "java(com.stockpro.movement.entity.MovementType.valueOf(request.getMovementType().trim().toUpperCase()))")
  StockMovement toEntity(StockMovementRequest request);

  StockMovementResponse toResponse(StockMovement stockMovement);
}
