package com.stockpro.alert.mapper;
 
import com.stockpro.alert.dto.request.AlertRequest;
import com.stockpro.alert.dto.response.AlertResponse;
import com.stockpro.alert.entity.Alert;
import com.stockpro.alert.entity.AlertChannel;
import com.stockpro.alert.entity.AlertSeverity;
import com.stockpro.alert.entity.AlertType;
import org.mapstruct.Mapper;
 
@Mapper(componentModel = "spring")
public interface AlertMapper {

  default Alert toEntity(AlertRequest request) {
    if (request == null) return null;

    return Alert.builder()
        .recipientId(request.getRecipientId())
        .type(AlertType.valueOf(request.getType().trim().toUpperCase()))
        .severity(AlertSeverity.valueOf(request.getSeverity().trim().toUpperCase()))
        .title(request.getTitle())
        .message(request.getMessage())
        .relatedProductId(request.getRelatedProductId())
        .relatedWarehouseId(request.getRelatedWarehouseId())
        .channel(AlertChannel.valueOf(request.getChannel().trim().toUpperCase()))
        .read(false)
        .acknowledged(false)
        .build();
  }

  AlertResponse toResponse(Alert alert);
}
