package com.stockpro.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.stockpro.auth.model.User;

/**
 * UserRepository — Spring Data JPA interface for User persistence.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    /** Find user by email (used for login and duplicate checks) */
    Optional<User> findByEmail(String email);

    /** Find user by userId (primary key alternative name) */
    User findByUserId(int userId);

    /** Check if an email is already registered */
    boolean existsByEmail(String email);

    /** Retrieve all users with a specific role */
    List<User> findAllByRole(String role);

    /** Retrieve all users belonging to a department */
    List<User> findByDepartment(String department);

    /** Retrieve all active or inactive users */
    List<User> findByIsActive(boolean active);

    /** Hard-delete a user by their userId */
    @Transactional
    void deleteByUserId(int userId);
}
