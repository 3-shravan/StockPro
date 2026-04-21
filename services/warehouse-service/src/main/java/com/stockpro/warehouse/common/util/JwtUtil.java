package com.stockpro.warehouse.common.util;

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

@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

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
