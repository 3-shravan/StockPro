package com.stockpro.auth.repository;

import com.stockpro.auth.model.Role;
import com.stockpro.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * UserRepository — Spring Data JPA interface for User persistence.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    /** Find user by email (used for login and duplicate checks) */
    Optional<User> findByEmail(String email);

    /** Find user by userId (primary key alternative name) */
    Optional<User> findByUserId(int userId);

    /** Check if an email is already registered */
    boolean existsByEmail(String email);

    /** Retrieve all users with a specific role */
    List<User> findAllByRole(Role role);

    /** Retrieve all users belonging to a department */
    List<User> findByDepartment(String department);

    /** Retrieve all active or inactive users */
    List<User> findByActive(boolean active);

    /** Hard-delete a user by their userId */
    @Transactional
    void deleteByUserId(int userId);
}
