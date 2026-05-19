package com.stockpro.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TokenRequest — lightweight DTO for methods that pass a JWT in the request body.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenRequest {
    @NotNull(message = "Token is required")
    private String token;
}
