package com.stockpro.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.stockpro.auth.model.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private Role role;

    @JsonAlias("active")
    private Boolean isActive;
}
