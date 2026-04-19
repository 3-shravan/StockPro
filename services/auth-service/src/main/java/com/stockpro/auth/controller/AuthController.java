package com.stockpro.auth.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockpro.auth.dto.TokenRequest;
import com.stockpro.auth.exception.CustomException;
import com.stockpro.auth.model.User;
import com.stockpro.auth.service.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AuthController — REST facade for the Auth/User-Service.
 * All business logic, DB access, and security decisions live in {@link AuthService}.
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
    public ResponseEntity<User> register(@RequestBody User user) {
        log.info("POST /auth/register — email={}", user.getEmail());

        User saved = authService.register(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ─── POST /auth/login ────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody Map<String, String> credentials) {
        log.info("POST /auth/login — email={}", credentials.get("email"));

        // Single service call — no double DB round-trip
        String token = authService.login(credentials.get("email"), credentials.get("password"));
        return ResponseEntity.ok(token);
    }

    // ─── POST /auth/logout ───────────────────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) TokenRequest request) {
 
        log.info("POST /auth/logout");
        String token = resolveToken(authHeader, request);
        authService.logout(token);
        return ResponseEntity.ok("Logged out successfully");
    }
 
    // ─── POST /auth/refresh ──────────────────────────────────────────────────
 
    @PostMapping("/refresh")
    public ResponseEntity<String> refresh(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) TokenRequest request) {
 
        log.info("POST /auth/refresh");
        String token = resolveToken(authHeader, request);
        String newToken = authService.refreshToken(token);
        return ResponseEntity.ok(newToken);
    }

    // ─── GET /auth/profile/{id} ──────────────────────────────────────────────

    @GetMapping("/profile/{id}")
    public ResponseEntity<User> getProfile(@PathVariable int id) {
        log.info("GET /auth/profile/{}", id);
        return ResponseEntity.ok(authService.getUserById(id));
    }

    // ─── PUT /auth/profile/{id} ──────────────────────────────────────────────

    @PutMapping("/profile/{id}")
    public ResponseEntity<User> updateProfile(
            @PathVariable int id,
            @RequestBody User user) {

        log.info("PUT /auth/profile/{}", id);
        return ResponseEntity.ok(authService.updateProfile(id, user));
    }

    // ─── PUT /auth/password ──────────────────────────────────────────────────

    @PutMapping("/password/{id}")
    public ResponseEntity<Void> changePassword(
            @PathVariable int id, @RequestBody Map<String, String> body) {

        log.info("PUT /auth/password — userId={}", id);
        authService.changePassword(id, body.get("newPassword"));

        return ResponseEntity.ok().build();
    }

    // ─── PUT /auth/deactivate/{id} ───────────────────────────────────────────

    /**
     * Soft-deactivate a user account. Requires ADMIN role.
     */
    @PostMapping("/deactivate/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateUser(@PathVariable int id) {
        log.info("POST /auth/deactivate/{}", id);
        authService.deactivateUser(id);
        return ResponseEntity.ok().build();
    }
 
    // ─── Private Helper ──────────────────────────────────────────────────────
 
    /**
     * Resolves a JWT token from either the Authorization header (Bearer)
     * or the TokenRequest body.
     *
     * @throws CustomException 400 if no token is found in either source.
     */
    private String resolveToken(String authHeader, TokenRequest request) {
        // 1. Check Header
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
 
        // 2. Check Body
        if (request != null && request.getToken() != null && !request.getToken().isBlank()) {
            return request.getToken();
        }
 
        log.warn("Token resolution failed — no token in header or body");
        throw new CustomException(
                "JWT Token is required. Please provide it in the Authorization header or request body.",
                HttpStatus.BAD_REQUEST);
    }
 
}
