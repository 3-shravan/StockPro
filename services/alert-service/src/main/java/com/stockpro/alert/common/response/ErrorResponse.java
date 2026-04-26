package com.stockpro.alert.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private boolean success = false;
    private String message;
    private String error;
    private int status;
    private String path;
    private String timestamp;

    public static ErrorResponse of(String message, String error, int status, String path) {
        return ErrorResponse.builder()
                .message(message)
                .error(error)
                .status(status)
                .path(path)
                .timestamp(LocalDateTime.now().toString())
                .build();
    }
}
