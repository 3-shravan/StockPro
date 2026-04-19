package com.stockpro.auth.controller;

import com.stockpro.auth.dto.*;
import com.stockpro.auth.exception.CustomException;
import com.stockpro.auth.mapper.UserMapper;
import com.stockpro.auth.model.User;
import com.stockpro.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AuthController — REST facade for the Auth/User-Service.
 *
 * <p><b>Pattern:</b> Thin Controller.
 * This class does <em>nothing</em> except:
 * <ol>
 *   <li>Validate the incoming HTTP request ({@code @Valid}).</li>
 *   <li>Delegate to the service layer.</li>
 *   <li>Wrap the result in the correct HTTP response.</li>
 * </ol>
 * All business logic, DB access, and security decisions live in {@link AuthService}.
 *
 * <pre>
 * ┌─────────────────────────────┬────────────┬────────────────────────┐
 * │ Endpoint                    │ Method     │ Access                 │
 * ├─────────────────────────────┼────────────┼────────────────────────┤
 * │ /auth/register              │ POST       │ Public                 │
 * │ /auth/login                 │ POST       │ Public                 │
 * │ /auth/logout                │ POST       │ Authenticated          │
 * │ /auth/refresh               │ POST       │ Authenticated          │
 * │ /auth/profile/{id}          │ GET        │ Authenticated          │
 * │ /auth/profile/{id}          │ PUT        │ Authenticated          │
 * │ /auth/password              │ PUT        │ Authenticated          │
 * │ /auth/deactivate/{id}       │ PUT        │ ADMIN only             │
 * │ /auth/users                 │ GET        │ ADMIN or MANAGER       │
 * └─────────────────────────────┴────────────┴────────────────────────┘
 * </pre>
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ─── POST /auth/register ─────────────────────────────────────────────────

    /**
     * Register a new user.
     * Self-registration defaults role to STAFF.
     * ADMIN can POST with an explicit role to create privileged accounts.
     */
    @PostMapping("/register")
    public ResponseEntity<User> register(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /auth/register — email={}", request.getEmail());

        User saved = authService.register(UserMapper.toEntity(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(UserMapper.sanitize(saved));
    }

    // ─── POST /auth/login ────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /auth/login — email={}", request.getEmail());

        // Single service call — no double DB round-trip
        AuthResponse response = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    // ─── POST /auth/logout ───────────────────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader("Authorization") String authHeader) {

        log.info("POST /auth/logout");
        authService.logout(extractBearerToken(authHeader));
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // ─── POST /auth/refresh ──────────────────────────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(
            @RequestHeader("Authorization") String authHeader) {

        log.info("POST /auth/refresh");
        String newToken = authService.refreshToken(extractBearerToken(authHeader));
        return ResponseEntity.ok(Map.of("token", newToken));
    }

    // ─── GET /auth/profile/{id} ──────────────────────────────────────────────

    @GetMapping("/profile/{id}")
    public ResponseEntity<User> getProfile(@PathVariable int id) {
        log.info("GET /auth/profile/{}", id);
        return ResponseEntity.ok(UserMapper.sanitize(authService.getUserById(id)));
    }

    // ─── PUT /auth/profile/{id} ──────────────────────────────────────────────

    @PutMapping("/profile/{id}")
    public ResponseEntity<User> updateProfile(
            @PathVariable int id,
            @RequestBody UpdateProfileRequest request) {

        log.info("PUT /auth/profile/{}", id);
        return ResponseEntity.ok(UserMapper.sanitize(authService.updateProfile(id, request)));
    }

    // ─── PUT /auth/password ──────────────────────────────────────────────────

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {

        log.info("PUT /auth/password — userId={}", request.getUserId());
        authService.changePassword(
                request.getUserId(),
                request.getOldPassword(),
                request.getNewPassword());

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    // ─── PUT /auth/deactivate/{id} ───────────────────────────────────────────

    /**
     * Soft-deactivate a user account. Requires ADMIN role.
     */
    @PutMapping("/deactivate/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable int id) {
        log.info("PUT /auth/deactivate/{}", id);
        authService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    // ─── GET /auth/users ─────────────────────────────────────────────────────

    /**
     * List all users. Requires ADMIN or MANAGER role.
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<User>> getAllUsers() {
        log.info("GET /auth/users");
        List<User> users = authService.getAllUsers();
        users.forEach(UserMapper::sanitize);
        return ResponseEntity.ok(users);
    }

    // ─── Private helper ──────────────────────────────────────────────────────

    /**
     * Extracts the raw JWT from a {@code "Bearer <token>"} Authorization header.
     *
     * @throws CustomException 400 if the header is absent or not prefixed with "Bearer "
     */
    private String extractBearerToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Malformed or missing Authorization header");
            throw new CustomException(
                    "Missing or malformed Authorization header",
                    HttpStatus.BAD_REQUEST);
        }
        return authHeader.substring(7);
    }
}
