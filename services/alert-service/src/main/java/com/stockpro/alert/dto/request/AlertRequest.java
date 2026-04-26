package com.stockpro.alert.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRequest {

  @NotNull(message = "recipientId is required")
  private Integer recipientId;

  @NotBlank(message = "type is required")
  private String type;

  @NotBlank(message = "severity is required")
  private String severity;

  @NotBlank(message = "title is required")
  private String title;

  @NotBlank(message = "message is required")
  private String message;

  private Integer relatedProductId;

  private Integer relatedWarehouseId;

  @NotBlank(message = "channel is required")
  private String channel;
}
