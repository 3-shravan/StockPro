package com.stockpro.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * AppConfig — General application beans.
 * Kept separate from SecurityConfig to avoid circular dependency:
 *   SecurityConfig → JwtAuthFilter → AuthServiceImpl → PasswordEncoder
 */
@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
