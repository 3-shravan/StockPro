package com.stockpro.auth.service;

import com.stockpro.auth.model.User;

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
     * Authenticate a user via email + password and return a JWT token string.
     *
     * @param email    user email
     * @param password raw password
     * @return JWT token string
     */
    String login(String email, String password);

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
     * Apply profile field updates.
     *
     * @param id   userId of the user to update
     * @param user User entity carrying the new values
     * @return updated {@link User} entity
     */
    User updateProfile(int id, User user);

    /**
     * Change a user's password.
     *
     * @param id          userId
     * @param newPassword new raw password to set
     */
    void changePassword(int id, String newPassword);

    /**
     * Soft-deactivate a user by setting isActive = false.
     * Deactivated users cannot log in.
     *
     * @param id userId to deactivate
     */
    void deactivateUser(int id);
}
