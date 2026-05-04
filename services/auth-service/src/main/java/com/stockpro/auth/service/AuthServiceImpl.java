package com.stockpro.auth.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stockpro.auth.config.JwtUtil;
import com.stockpro.auth.dto.AuthResponse;
import com.stockpro.auth.exception.CustomException;
import com.stockpro.auth.model.User;
import com.stockpro.auth.repository.UserRepository;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * AuthServiceImpl — implements all authentication and user management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long tokenExpiry;

    /**
     * In-memory JWT blacklist — thread-safe.
     * Tokens are added on logout and on token refresh (so old tokens cannot be
     * reused).
     */
    private final Set<String> blacklistedTokens = Collections.synchronizedSet(new HashSet<>());

    // ─── Register ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public User register(User user) {
        log.info("Registering new user with email: {}", user.getEmail());

        if (userRepository.existsByEmail(user.getEmail())) {
            log.warn("Registration failed — email already exists: {}", user.getEmail());
            throw new CustomException(
                    "Email is already registered: " + user.getEmail(),
                    HttpStatus.CONFLICT);
        }

        // passwordHash carries the raw password before this line
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        User saved = userRepository.save(user);

        log.info("User registered successfully — userId={}, role={}",
                saved.getUserId(), saved.getRole());
        return saved;
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * Authenticates the user and returns a fully populated {@link AuthResponse}.
     * A single service call so the controller does not need two DB round-trips.
     */
    @Override
    @Transactional
    public String login(String email, String password) {
        log.info("Login attempt for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Login failed — no account found for email: {}", email);
                    return new CustomException(
                            "No account found with email: " + email,
                            HttpStatus.UNAUTHORIZED);
                });

        if (!user.isActive()) {
            log.warn("Login failed — account deactivated for userId={}", user.getUserId());
            throw new CustomException(
                    "This account has been deactivated. Contact your administrator.",
                    HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("Login failed — invalid password for email: {}", email);
            throw new CustomException("Invalid email or password.", HttpStatus.UNAUTHORIZED);
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getUserId(),
                user.getRole().name(),
                user.getDepartment());

        log.info("Login successful — userId={}, role={}", user.getUserId(), user.getRole());

        return token;
    }

    // ─── Logout ──────────────────────────────────────────────────────────────

    @Override
    public void logout(String token) {
        blacklistedTokens.add(token);
        log.info("Token blacklisted (logout). Blacklist size: {}", blacklistedTokens.size());
    }

    // ─── Validate Token ──────────────────────────────────────────────────────

    @Override
    public boolean validateToken(String token) {
        if (blacklistedTokens.contains(token)) {
            log.debug("Token validation failed — token is blacklisted");
            return false;
        }
        boolean valid = jwtUtil.isTokenStructurallyValid(token);
        if (!valid) {
            log.debug("Token validation failed — invalid signature or expired");
        }
        return valid;
    }

    // ─── Refresh Token ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public String refreshToken(String token) {
        log.info("Token refresh requested");

        if (!validateToken(token)) {
            log.warn("Token refresh denied — token invalid or blacklisted");
            throw new CustomException(
                    "Token is invalid or expired. Please log in again.",
                    HttpStatus.UNAUTHORIZED);
        }

        Claims claims = jwtUtil.extractAllClaims(token);
        String email = claims.getSubject();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.error("Token refresh failed — user no longer exists: {}", email);
                    return new CustomException("User no longer exists.", HttpStatus.NOT_FOUND);
                });

        // Blacklist old token — cannot be reused after refresh
        blacklistedTokens.add(token);

        String newToken = jwtUtil.generateToken(
                user.getEmail(),
                user.getUserId(),
                user.getRole().name(),
                user.getDepartment());

        log.info("Token refreshed successfully for userId={}", user.getUserId());
        return newToken;
    }

    // ─── Get User ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public User getUserById(int id) {
        log.debug("Fetching user by id={}", id);
        User user = userRepository.findByUserId(id);
        if (user == null) {
            log.warn("User not found — id={}", id);
            throw new CustomException(
                    "User not found with ID: " + id, HttpStatus.NOT_FOUND);
        }
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        log.debug("Fetching user by email={}", email);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found — email={}", email);
                    return new CustomException(
                            "User not found with email: " + email, HttpStatus.NOT_FOUND);
                });
    }

    // ─── Update Profile ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public User updateProfile(int id, User request) {
        log.info("Updating profile for userId={}", id);

        User user = getUserById(id);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }

        User updated = userRepository.save(user);
        log.info("Profile updated for userId={}", id);
        return updated;
    }

    // ─── Change Password ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public void changePassword(int id, String newPassword) {
        log.info("Password change requested for userId={}", id);

        User user = getUserById(id);

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password changed successfully for userId={}", id);
    }

    // ─── Deactivate User ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deactivate(int id) {
        log.info("Deactivation requested for userId={}", id);

        User user = getUserById(id);

        if (!user.isActive()) {
            log.warn("Deactivation failed — userId={} is already inactive", id);
            throw new CustomException(
                    "User with ID " + id + " is already deactivated.",
                    HttpStatus.BAD_REQUEST);
        }

        user.setActive(false);
        userRepository.save(user);

        log.info("User deactivated — userId={}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        log.debug("Fetching all users from repository");
        return userRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public User getMe(String token) {
        log.debug("Getting current user details from token");
        String email = jwtUtil.extractEmail(token);
        return getUserByEmail(email);
    }
}
