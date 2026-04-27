package com.stockpro.alert.mapper;

import com.stockpro.alert.dto.request.AlertRequest;
import com.stockpro.alert.dto.response.AlertResponse;
import com.stockpro.alert.entity.Alert;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AlertMapper {

  @Mapping(target = "alertId", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "read", constant = "false")
  @Mapping(target = "acknowledged", constant = "false")
  @Mapping(target = "type", expression = "java(com.stockpro.alert.entity.AlertType.valueOf(request.getType().trim().toUpperCase()))")
  @Mapping(target = "severity", expression = "java(com.stockpro.alert.entity.AlertSeverity.valueOf(request.getSeverity().trim().toUpperCase()))")
  @Mapping(target = "channel", expression = "java(com.stockpro.alert.entity.AlertChannel.valueOf(request.getChannel().trim().toUpperCase()))")
  Alert toEntity(AlertRequest request);

  AlertResponse toResponse(Alert alert);
}
