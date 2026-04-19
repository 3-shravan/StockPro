package com.stockpro.auth.service;

import com.stockpro.auth.dto.AuthResponse;
import com.stockpro.auth.dto.UpdateProfileRequest;
import com.stockpro.auth.model.User;

import java.util.List;

/**
 * AuthService — declares all business operations for authentication and user management.
 *
 * <p><b>Pattern:</b> Service Layer + Interface / Implementation separation.
 * Controllers depend only on this interface, never on {@code AuthServiceImpl},
 * which makes swapping implementations (e.g. for tests) trivial.
 */
public interface AuthService {

    /**
     * Register a new user account and return a sanitized (no passwordHash) view.
     *
     * @param user User entity built from the registration DTO (passwordHash = raw password)
     * @return persisted {@link User} with passwordHash cleared
     */
    User register(User user);

    /**
     * Authenticate a user via email + password and return a full {@link AuthResponse}.
     * A single service call so the controller does not make two DB round-trips.
     *
     * @param email    user email
     * @param password raw password
     * @return populated {@link AuthResponse} (token + user metadata)
     */
    AuthResponse login(String email, String password);

    /**
     * Invalidate a JWT token by adding it to the in-memory blacklist.
     *
     * @param token JWT token to invalidate
     */
    void logout(String token);

    /**
     * Validate a JWT token (checks blacklist + signature + expiry).
     *
     * @param token JWT token
     * @return true if valid and not blacklisted
     */
    boolean validateToken(String token);

    /**
     * Issue a new JWT token, invalidating the old one.
     *
     * @param token existing valid JWT
     * @return new JWT token string
     */
    String refreshToken(String token);

    /**
     * Retrieve a user by their numeric ID.
     *
     * @param id userId
     * @return {@link User} entity
     */
    User getUserById(int id);

    /**
     * Retrieve a user by their email address.
     *
     * @param email user email
     * @return {@link User} entity
     */
    User getUserByEmail(String email);

    /**
     * Apply non-sensitive profile field updates (fullName, phone, department).
     *
     * @param id      userId of the user to update
     * @param request DTO carrying the new field values
     * @return updated and sanitized {@link User} entity
     */
    User updateProfile(int id, UpdateProfileRequest request);

    /**
     * Change a user's password with old-password verification.
     *
     * @param id          userId
     * @param oldPassword current raw password (for verification)
     * @param newPassword new raw password to set
     */
    void changePassword(int id, String oldPassword, String newPassword);

    /**
     * Soft-deactivate a user by setting isActive = false.
     * Deactivated users cannot log in.
     *
     * @param id userId to deactivate
     */
    void deactivateUser(int id);

    /**
     * Retrieve all registered users (passwordHash cleared on each).
     *
     * @return list of all sanitized {@link User} entities
     */
    List<User> getAllUsers();
}
