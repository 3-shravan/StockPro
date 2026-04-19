package com.stockpro.auth.dto;

import lombok.*;

/**
 * Response body returned after a successful login or token refresh.
 * {@code role} is serialized as its enum name string (e.g. "ADMIN").
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private int userId;
    private String role;       // enum name — safe to return as plain String in JSON
    private String department;
    private String message;
}
