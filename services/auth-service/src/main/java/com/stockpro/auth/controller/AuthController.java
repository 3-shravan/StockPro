package com.stockpro.auth.controller;
 
import java.util.List;
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
 
import com.stockpro.auth.dto.AuthResponse;
import com.stockpro.auth.dto.RegisterRequest;
import com.stockpro.auth.dto.TokenRequest;
import com.stockpro.auth.exception.CustomException;
import com.stockpro.auth.model.User;
import com.stockpro.auth.service.AuthService;
 
import jakarta.validation.Valid;
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
 * │ /auth/password/{id}         │ PUT        │ Authenticated          │
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
 
    @PostMapping("/register")
    public ResponseEntity<User> register(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /auth/register — email={}", request.getEmail());
 
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(request.getPassword()) 
                .phone(request.getPhone())
                .department(request.getDepartment())
                .role(request.getRole())
                .build();
 
        User saved = authService.register(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
 
    // ─── POST /auth/login ────────────────────────────────────────────────────
 
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody Map<String, String> credentials) {
        log.info("POST /auth/login — email={}", credentials.get("email"));
        String token = authService.login(credentials.get("email"), credentials.get("password"));
        return ResponseEntity.ok(new AuthResponse(token));
    }
 
    // ─── POST /auth/logout ───────────────────────────────────────────────────
 
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) TokenRequest request) {
 
        log.info("POST /auth/logout");
        String token = resolveToken(authHeader, request);
        authService.logout(token);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
 
    // ─── POST /auth/refresh ──────────────────────────────────────────────────
 
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) TokenRequest request) {
 
        log.info("POST /auth/refresh");
        String token = resolveToken(authHeader, request);
        String newToken = authService.refreshToken(token);
        return ResponseEntity.ok(new AuthResponse(newToken));
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
 
    // ─── PUT /auth/password/{id} ─────────────────────────────────────────────
 
    @PutMapping("/password/{id}")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable int id, @RequestBody Map<String, String> body) {
 
        log.info("PUT /auth/password — userId={}", id);
        authService.changePassword(id, body.get("newPassword"));
 
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
 
    // ─── PUT /auth/deactivate/{id} ───────────────────────────────────────────
 
    /**
     * Soft-deactivate a user account. Requires ADMIN role.
     * Mapped to @PutMapping to resolve the 'PUT not supported' error from diagram mismatch.
     */
    @PutMapping("/deactivate/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable int id) {
        log.info("PUT /auth/deactivate/{}", id);
        authService.deactivate(id);
        return ResponseEntity.ok().build();
    }
 
    // ─── GET /auth/users ─────────────────────────────────────────────────────
 
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<User>> getAllUsers() {
        log.info("GET /auth/users");
        return ResponseEntity.ok(authService.getAllUsers());
    }
 
    // ─── Private Helper ──────────────────────────────────────────────────────
 
    private String resolveToken(String authHeader, TokenRequest request) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        if (request != null && request.getToken() != null && !request.getToken().isBlank()) {
            return request.getToken();
        }
        throw new CustomException(
                "JWT Token is required.",
                HttpStatus.BAD_REQUEST);
    }
}
