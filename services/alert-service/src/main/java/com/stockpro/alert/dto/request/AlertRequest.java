package com.stockpro.alert.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRequest {

  private Integer recipientId;
  private String targetRole;
  private Integer targetWarehouseId;

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
