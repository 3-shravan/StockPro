package com.stockpro.auth.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JwtUtil — stateless utility component for all JWT operations.
 *
 * <p>Uses HMAC-SHA256 with a plain-string secret ({@code >= 32 chars} required).
 * Token payload carries: {@code sub} (email), {@code userId}, {@code role}, {@code department}.
 *
 * <p>This class does <em>not</em> handle the blacklist — that responsibility belongs
 * to {@link com.stockpro.auth.service.AuthServiceImpl}.
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long tokenExpiry;

    // ─── Signing Key ──────────────────────────────────────────────────────────

    /**
     * Derives the HMAC-SHA256 signing key from the configured secret.
     * Called on every token operation — key derivation is fast and the secret is immutable.
     */
    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ─── Token Generation ─────────────────────────────────────────────────────

    /**
     * Generate a signed, compact JWT for the given user details.
     *
     * @param email      {@code sub} claim
     * @param userId     {@code userId} custom claim
     * @param role       {@code role} custom claim (enum name, e.g. "ADMIN")
     * @param department {@code department} custom claim
     * @return compact JWT string
     */
    public String generateToken(String email, int userId, String role, String department) {
        log.debug("Generating JWT for email={}, role={}", email, role);

        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .claim("department", department)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + tokenExpiry))
                .signWith(signingKey())
                .compact();
    }

    // ─── Claim Extraction ─────────────────────────────────────────────────────

    /**
     * Parse and return all claims from a token.
     *
     * @throws JwtException if the signature is invalid or the token is expired
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Extracts the {@code sub} (email) claim. */
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    /** Extracts the {@code role} custom claim. */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /** Extracts the {@code userId} custom claim. */
    public int extractUserId(String token) {
        return extractAllClaims(token).get("userId", Integer.class);
    }

    // ─── Structural Validation ────────────────────────────────────────────────

    /**
     * Returns {@code true} if the token has a valid signature and has not expired.
     * Blacklist checking is handled separately in
     * {@link com.stockpro.auth.service.AuthServiceImpl#validateToken(String)}.
     */
    public boolean isTokenStructurallyValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            boolean valid = claims.getExpiration().after(new Date());
            if (!valid) {
                log.debug("Token structural check failed — token is expired");
            }
            return valid;
        } catch (JwtException ex) {
            log.debug("Token structural check failed — {}", ex.getMessage());
            return false;
        } catch (Exception ex) {
            log.warn("Unexpected error during token structural validation: {}", ex.getMessage());
            return false;
        }
    }
}
