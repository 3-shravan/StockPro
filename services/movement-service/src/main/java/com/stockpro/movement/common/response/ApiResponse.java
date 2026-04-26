package com.stockpro.movement.common.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

  private int status;
  private String message;
  private T data;

  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime timestamp;

  public static <T> ApiResponse<T> success(int status, String message, T data) {
    return ApiResponse.<T>builder()
        .status(status)
        .message(message)
        .data(data)
        .timestamp(LocalDateTime.now())
        .build();
  }

  public static <T> ApiResponse<T> success(String message, T data) {
    return success(200, message, data);
  }

  public static <T> ApiResponse<T> error(int status, String message) {
    return ApiResponse.<T>builder()
        .status(status)
        .message(message)
        .timestamp(LocalDateTime.now())
        .build();
  }
}
