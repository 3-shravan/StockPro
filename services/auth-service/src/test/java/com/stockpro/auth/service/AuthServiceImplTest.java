package com.stockpro.auth.service;

import com.stockpro.auth.config.JwtUtil;
import com.stockpro.auth.dto.AuthResponse;
import com.stockpro.auth.dto.UpdateProfileRequest;
import com.stockpro.auth.exception.CustomException;
import com.stockpro.auth.model.Role;
import com.stockpro.auth.model.User;
import com.stockpro.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AuthServiceImpl}.
 *
 * Uses Mockito — all collaborators (repository, encoder, jwtUtil) are mocked.
 * No Spring context, no database, no network.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl")
class AuthServiceImplTest {

    @Mock private UserRepository  userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil         jwtUtil;

    @InjectMocks
    private AuthServiceImpl authService;

    // ─── Shared test data ─────────────────────────────────────────────────────

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .userId(1)
                .fullName("Alice Smith")
                .email("alice@example.com")
                .passwordHash("$2a$hashed")
                .role(Role.STAFF)
                .department("IT")
                .active(true)
                .build();
    }

    // ─── register() ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("saves and returns the user when email is new")
        void success() {
            when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");
            when(userRepository.save(any(User.class))).thenReturn(activeUser);

            User result = authService.register(activeUser);

            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("alice@example.com");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("throws CONFLICT when email already exists")
        void duplicateEmail_throwsConflict() {
            when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

            CustomException ex = catchThrowableOfType(
                    () -> authService.register(activeUser), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
            verify(userRepository, never()).save(any());
        }
    }

    // ─── login() ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("returns AuthResponse with token on valid credentials")
        void success() {
            when(userRepository.findByEmail("alice@example.com"))
                    .thenReturn(Optional.of(activeUser));
            when(passwordEncoder.matches("rawPass", "$2a$hashed")).thenReturn(true);
            when(jwtUtil.generateToken(anyString(), anyInt(), anyString(), anyString()))
                    .thenReturn("mock.jwt.token");
            when(userRepository.save(any())).thenReturn(activeUser);

            AuthResponse response = authService.login("alice@example.com", "rawPass");

            assertThat(response.getToken()).isEqualTo("mock.jwt.token");
            assertThat(response.getRole()).isEqualTo("STAFF");
        }

        @Test
        @DisplayName("throws UNAUTHORIZED when email not found")
        void unknownEmail_throwsUnauthorized() {
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

            CustomException ex = catchThrowableOfType(
                    () -> authService.login("nobody@example.com", "pass"),
                    CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("throws FORBIDDEN when account is deactivated")
        void deactivatedAccount_throwsForbidden() {
            activeUser.setActive(false);
            when(userRepository.findByEmail("alice@example.com"))
                    .thenReturn(Optional.of(activeUser));

            CustomException ex = catchThrowableOfType(
                    () -> authService.login("alice@example.com", "rawPass"),
                    CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        }

        @Test
        @DisplayName("throws UNAUTHORIZED when password is wrong")
        void wrongPassword_throwsUnauthorized() {
            when(userRepository.findByEmail("alice@example.com"))
                    .thenReturn(Optional.of(activeUser));
            when(passwordEncoder.matches("wrongPass", "$2a$hashed")).thenReturn(false);

            CustomException ex = catchThrowableOfType(
                    () -> authService.login("alice@example.com", "wrongPass"),
                    CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }
    }

    // ─── logout() + validateToken() ─────────────────────────────────────────

    @Nested
    @DisplayName("logout() + validateToken()")
    class LogoutAndValidate {

        @Test
        @DisplayName("token is invalid after logout (blacklisted)")
        void tokenBlacklistedAfterLogout() {
            String token = "some.valid.token";

            // Before logout — token is structurally valid
            when(jwtUtil.isTokenStructurallyValid(token)).thenReturn(true);
            assertThat(authService.validateToken(token)).isTrue();

            // After logout — token is blacklisted, must return false regardless of structure
            authService.logout(token);
            assertThat(authService.validateToken(token)).isFalse();
        }
    }

    // ─── changePassword() ────────────────────────────────────────────────────

    @Nested
    @DisplayName("changePassword()")
    class ChangePassword {

        @Test
        @DisplayName("updates passwordHash when old password matches")
        void success() {
            when(userRepository.findById(1)).thenReturn(Optional.of(activeUser));
            when(passwordEncoder.matches("oldPass", "$2a$hashed")).thenReturn(true);
            when(passwordEncoder.encode("newPass")).thenReturn("$2a$newHashed");
            when(userRepository.save(any())).thenReturn(activeUser);

            assertThatNoException()
                    .isThrownBy(() -> authService.changePassword(1, "oldPass", "newPass"));

            assertThat(activeUser.getPasswordHash()).isEqualTo("$2a$newHashed");
        }

        @Test
        @DisplayName("throws BAD_REQUEST when old password is incorrect")
        void wrongOldPassword_throwsBadRequest() {
            when(userRepository.findById(1)).thenReturn(Optional.of(activeUser));
            when(passwordEncoder.matches("wrongOld", "$2a$hashed")).thenReturn(false);

            CustomException ex = catchThrowableOfType(
                    () -> authService.changePassword(1, "wrongOld", "newPass"),
                    CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    // ─── deactivateUser() ────────────────────────────────────────────────────

    @Nested
    @DisplayName("deactivateUser()")
    class DeactivateUser {

        @Test
        @DisplayName("sets active=false for an active user")
        void success() {
            when(userRepository.findById(1)).thenReturn(Optional.of(activeUser));
            when(userRepository.save(any())).thenReturn(activeUser);

            authService.deactivateUser(1);

            assertThat(activeUser.isActive()).isFalse();
        }

        @Test
        @DisplayName("throws BAD_REQUEST when user is already inactive")
        void alreadyInactive_throwsBadRequest() {
            activeUser.setActive(false);
            when(userRepository.findById(1)).thenReturn(Optional.of(activeUser));

            CustomException ex = catchThrowableOfType(
                    () -> authService.deactivateUser(1), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    // ─── getUserById() ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getUserById()")
    class GetUserById {

        @Test
        @DisplayName("returns user when found")
        void found() {
            when(userRepository.findById(1)).thenReturn(Optional.of(activeUser));
            assertThat(authService.getUserById(1).getEmail()).isEqualTo("alice@example.com");
        }

        @Test
        @DisplayName("throws NOT_FOUND when id does not exist")
        void notFound_throwsNotFound() {
            when(userRepository.findById(999)).thenReturn(Optional.empty());

            CustomException ex = catchThrowableOfType(
                    () -> authService.getUserById(999), CustomException.class);

            assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    // ─── getAllUsers() ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getAllUsers()")
    class GetAllUsers {

        @Test
        @DisplayName("returns all users from the repository")
        void returnsAll() {
            when(userRepository.findAll()).thenReturn(List.of(activeUser));
            assertThat(authService.getAllUsers()).hasSize(1);
        }
    }

    // ─── updateProfile() ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateProfile()")
    class UpdateProfile {

        @Test
        @DisplayName("updates only non-null fields")
        void partialUpdate() {
            when(userRepository.findById(1)).thenReturn(Optional.of(activeUser));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileRequest req = new UpdateProfileRequest();
            req.setFullName("Alice Updated");

            User result = authService.updateProfile(1, req);

            assertThat(result.getFullName()).isEqualTo("Alice Updated");
            assertThat(result.getDepartment()).isEqualTo("IT"); // unchanged
        }
    }
}
