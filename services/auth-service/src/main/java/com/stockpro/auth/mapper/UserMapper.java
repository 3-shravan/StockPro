package com.stockpro.auth.mapper;

import com.stockpro.auth.dto.RegisterRequest;
import com.stockpro.auth.dto.UpdateProfileRequest;
import com.stockpro.auth.model.Role;
import com.stockpro.auth.model.User;

/**
 * UserMapper — pure static utility class for converting between DTOs and the User entity.
 *
 * <p><b>Pattern:</b> Mapper / Assembler.
 * Keeps the conversion logic in one place so neither the Controller nor the Service
 * has to know how to build a {@link User} from a DTO. This makes both layers
 * easier to test and reason about.
 *
 * <p>No Spring beans or external dependencies — all methods are stateless and side-effect-free.
 */
public final class UserMapper {

    // Utility class — never instantiated
    private UserMapper() {}

    /**
     * Convert a {@link RegisterRequest} DTO into a transient {@link User} entity
     * ready to be passed to the service layer for persistence.
     *
     * <p>The {@code passwordHash} field is populated with the <em>raw</em> password;
     * the service layer is responsible for encoding it before saving.
     */
    public static User toEntity(RegisterRequest request) {
        return User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(request.getPassword())   // raw — service will encode
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : Role.STAFF)
                .department(request.getDepartment())
                .build();
    }

    /**
     * Convert an {@link UpdateProfileRequest} DTO into a partial {@link User} entity
     * carrying only the fields that are allowed to be updated via profile edit.
     */
    public static User toProfilePatch(UpdateProfileRequest request) {
        return User.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .department(request.getDepartment())
                .build();
    }

    /**
     * Sanitize a {@link User} entity for API responses by nulling the password hash.
     * Called on any user object before it leaves the controller.
     *
     * @return the same object (mutated in place) for fluent chaining
     */
    public static User sanitize(User user) {
        user.setPasswordHash(null);
        return user;
    }
}
