package com.stockpro.auth.dto;

import lombok.Data;

/**
 * Request body for PUT /auth/profile/{id}
 * Only non-sensitive profile fields can be updated here.
 */
@Data
public class UpdateProfileRequest {

    private String fullName;
    private String phone;
    private String department;
}
