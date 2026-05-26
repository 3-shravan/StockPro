package com.stockpro.auth.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link JwtUtil}.
 *
 * Does NOT load the Spring context — tests the class directly using
 * ReflectionTestUtils to inject @Value fields.
 */
@DisplayName("JwtUtil")
class JwtUtilTest {

    private static final String SECRET = "test_jwt_secret_for_unit_tests_only_32_chars";
    private static final long EXPIRY = 3_600_000L; // 1 hour

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtUtil, "tokenExpiry", EXPIRY);
    }

    // ── generateToken / extract ───────────────────────────────────────────────

    @Test
    @DisplayName("generateToken: produces a non-blank compact JWT")
    void generateToken_returnsNonBlankJwt() {
        String token = jwtUtil.generateToken("user@example.com", 1, "STAFF", "IT");
        assertThat(token).isNotBlank().contains(".");
    }

    @Test
    @DisplayName("extractEmail: returns the subject used during generation")
    void extractEmail_returnsCorrectSubject() {
        String token = jwtUtil.generateToken("alice@example.com", 42, "ADMIN", "Finance");
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("extractRole: returns the role claim")
    void extractRole_returnsCorrectRole() {
        String token = jwtUtil.generateToken("bob@example.com", 10, "MANAGER", "Ops");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("MANAGER");
    }

    @Test
    @DisplayName("extractUserId: returns the userId claim")
    void extractUserId_returnsCorrectId() {
        String token = jwtUtil.generateToken("carol@example.com", 99, "STAFF", "HR");
        assertThat(jwtUtil.extractUserId(token)).isEqualTo(99);
    }

    // ── isTokenStructurallyValid ──────────────────────────────────────────────

    @Test
    @DisplayName("isTokenStructurallyValid: returns true for a fresh token")
    void isValid_freshToken_returnsTrue() {
        String token = jwtUtil.generateToken("dave@example.com", 5, "STAFF", "IT");
        assertThat(jwtUtil.isTokenStructurallyValid(token)).isTrue();
    }

    @Test
    @DisplayName("isTokenStructurallyValid: returns false for a tampered token")
    void isValid_tamperedToken_returnsFalse() {
        String token = jwtUtil.generateToken("eve@example.com", 7, "STAFF", "IT");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertThat(jwtUtil.isTokenStructurallyValid(tampered)).isFalse();
    }

    @Test
    @DisplayName("isTokenStructurallyValid: returns false for an expired token")
    void isValid_expiredToken_returnsFalse() {
        // Inject a zero-millisecond expiry to force immediate expiration
        ReflectionTestUtils.setField(jwtUtil, "tokenExpiry", 0L);
        String token = jwtUtil.generateToken("frank@example.com", 8, "STAFF", "IT");
        assertThat(jwtUtil.isTokenStructurallyValid(token)).isFalse();
    }

    @Test
    @DisplayName("isTokenStructurallyValid: returns false for a garbage string")
    void isValid_garbageString_returnsFalse() {
        assertThat(jwtUtil.isTokenStructurallyValid("this.is.not.a.jwt")).isFalse();
    }
}
