package com.stockpro.alert.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkAlertRequest {

  @NotEmpty(message = "recipientIds is required")
  private List<Integer> recipientIds;

  @NotBlank(message = "title is required")
  private String title;

  @NotBlank(message = "message is required")
  private String message;

  @NotBlank(message = "severity is required")
  private String severity;

  @NotBlank(message = "type is required")
  private String type;

  @NotBlank(message = "channel is required")
  private String channel;

  private Integer relatedProductId;

  private Integer relatedWarehouseId;
}
