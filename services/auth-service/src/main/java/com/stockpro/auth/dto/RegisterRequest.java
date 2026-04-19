package com.stockpro.auth.dto;

import com.stockpro.auth.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for POST /auth/register
 *
 * The {@code role} field is typed as the {@link Role} enum. Jackson will
 * automatically reject any value that is not one of STAFF / MANAGER / OFFICER
 * / ADMIN with a 400 Bad Request — no fragile regex required.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Must be a valid email address")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String phone;

    /**
     * Role for the new user. Defaults to STAFF if not supplied.
     * Valid values: STAFF | MANAGER | OFFICER | ADMIN
     */
    private Role role = Role.STAFF;

    private String department;
}
