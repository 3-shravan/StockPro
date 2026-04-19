package com.stockpro.auth.dto;

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
    private String token;
}
