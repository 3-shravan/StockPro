package com.stockpro.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for PUT /auth/password
 * Requires the current (old) password for verification before updating.
 */
@Data
public class ChangePasswordRequest {

    @NotNull(message = "User ID is required")
    private Integer userId;

    @NotBlank(message = "Current password is required")
    private String oldPassword;

    @NotBlank(message = "New password is required")
    private String newPassword;
}
