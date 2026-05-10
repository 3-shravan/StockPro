package com.stockpro.auth.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/**
 * User entity — represents a StockPro platform user.
 * Roles: STAFF | MANAGER | OFFICER | ADMIN
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "passwordHash")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int userId;

    @NotBlank(message = "Full name is required")
    @Column(nullable = false)
    private String fullName;

    @Email(message = "Must be a valid email address")
    @NotBlank(message = "Email is required")
    @Column(unique = true, nullable = false)
    private String email;

    /** BCrypt-hashed password — never returned in API responses */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String passwordHash;

    private String phone;

    /**
     * User role controlling access levels.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** Department enables department-level data scoping across services */
    private String department;

    @JsonProperty("isActive")
    @Column(name = "is_active")
    private boolean isActive;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastLoginAt;

    // ─── JPA Lifecycle ───────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        isActive = true;
        if (role == null) {
            role = Role.STAFF;
        }
    }
}
