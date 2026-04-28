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

import com.stockpro.auth.common.response.ApiResponse;
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
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@Valid @RequestBody RegisterRequest request) {
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
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("User registered successfully", saved));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody Map<String, String> credentials) {
        log.info("POST /auth/login — email={}", credentials.get("email"));
        String token = authService.login(credentials.get("email"), credentials.get("password"));
        return ResponseEntity.ok(ApiResponse.success("Login successful", new AuthResponse(token)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) TokenRequest request) {

        log.info("POST /auth/logout");
        String token = resolveToken(authHeader, request);
        authService.logout(token);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) TokenRequest request) {

        log.info("POST /auth/refresh");
        String token = resolveToken(authHeader, request);
        String newToken = authService.refreshToken(token);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", new AuthResponse(newToken)));
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<ApiResponse<User>> getProfile(@PathVariable int id) {
        log.info("GET /auth/profile/{}", id);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", authService.getUserById(id)));
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @PathVariable int id,
            @RequestBody User user) {

        log.info("PUT /auth/profile/{}", id);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", authService.updateProfile(id, user)));
    }

    @PutMapping("/password/{id}")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable int id, @RequestBody Map<String, String> body) {

        log.info("PUT /auth/password — userId={}", id);
        authService.changePassword(id, body.get("newPassword"));

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PutMapping("/deactivate/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable int id) {
        log.info("PUT /auth/deactivate/{}", id);
        authService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", null));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        log.info("GET /auth/users");
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", authService.getAllUsers()));
    }

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
