package com.stockpro.alert.mapper;
 
import com.stockpro.alert.dto.response.AlertResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
 
@Mapper(componentModel = "spring")
public interface AlertMapper {

  @Mapping(target = "alertId", ignore = true)
  @Mapping(target = "read", constant = "false")
  @Mapping(target = "acknowledged", constant = "false")
  @Mapping(target = "acknowledgedBy", ignore = true)
  @Mapping(target = "acknowledgedAt", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  com.stockpro.alert.entity.Alert toEntity(com.stockpro.alert.dto.request.AlertRequest request);

  @Mapping(target = "acknowledgedByName", ignore = true)
  AlertResponse toResponse(com.stockpro.alert.entity.Alert alert);

  default com.stockpro.alert.entity.AlertType mapType(String type) {
    if (type == null) return null;
    return com.stockpro.alert.entity.AlertType.valueOf(type.trim().toUpperCase());
  }

  default com.stockpro.alert.entity.AlertSeverity mapSeverity(String severity) {
    if (severity == null) return null;
    return com.stockpro.alert.entity.AlertSeverity.valueOf(severity.trim().toUpperCase());
  }

  default com.stockpro.alert.entity.AlertChannel mapChannel(String channel) {
    if (channel == null) return null;
    return com.stockpro.alert.entity.AlertChannel.valueOf(channel.trim().toUpperCase());
  }
}
