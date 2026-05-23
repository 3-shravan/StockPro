package com.stockpro.auth.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stockpro.auth.common.response.ApiResponse;
import com.stockpro.auth.dto.AuthResponse;
import com.stockpro.auth.dto.LoginRequest;
import com.stockpro.auth.dto.RegisterRequest;
import com.stockpro.auth.dto.TokenRequest;
import com.stockpro.auth.dto.UserUpdateRequest;
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
    @PreAuthorize("hasRole('ADMIN')")
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
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /auth/login — email={}", request.getEmail());
        AuthResponse response = authService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
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
        return ResponseEntity.ok(ApiResponse.success(
                "Token refreshed successfully",
                AuthResponse.builder().token(newToken).build()));
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        log.info("GET /auth/users");
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", authService.getAllUsers()));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable int id) {
        log.info("GET /auth/users/{}", id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", authService.getUserById(id)));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable int id,
            @RequestBody UserUpdateRequest user) {

        log.info("PUT /auth/users/{}", id);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", authService.updateUser(id, user)));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable int id) {
        log.info("DELETE /auth/users/{}", id);
        authService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getMe(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) TokenRequest request) {
        
        log.info("GET /auth/me");
        String token = resolveToken(authHeader, request);
        User user = authService.getMe(token);
        return ResponseEntity.ok(ApiResponse.success("Current user details retrieved", user));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> getProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) TokenRequest request) {
        
        log.info("GET /auth/profile (alias for /me)");
        return getMe(authHeader, request);
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
