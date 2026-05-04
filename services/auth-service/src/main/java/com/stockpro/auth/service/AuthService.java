package com.stockpro.auth.service;

import java.util.List;

import com.stockpro.auth.model.User;

/**
 * AuthService — declares all business operations for authentication and user
 * management.
 *
 */
public interface AuthService {

    /**
     * Register a new user account.
     *
     * @param user User entity. The 'passwordHash' field should carry the raw
     *             password,
     *             which will be encoded by the service before persistence.
     * @return the persisted {@link User} entity
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
    void deactivate(int id);
 
    /**
     * Retrieve all registered users.
     *
     * @return List of {@link User} entities
     */
    List<User> getAllUsers();

    /**
     * Get details of the currently authenticated user from a JWT token.
     * 
     * @param token JWT token string
     * @return {@link User} entity
     */
    User getMe(String token);
}
