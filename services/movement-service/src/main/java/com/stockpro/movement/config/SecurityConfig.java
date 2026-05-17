package com.stockpro.movement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;

/**
 * SecurityConfig — Minimal security for movement-service.
 *
 * <p>All JWT validation is handled by the API Gateway. This service trusts
 * the gateway-injected headers verified via InternalSecurityFilter.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final InternalSecurityFilter internalSecurityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/actuator/**", "/v3/api-docs/**", "/*/v3/api-docs/**", "/swagger-ui/**", "/*/swagger-ui/**", "/swagger-ui.html", "/*/swagger-ui.html").permitAll()
                    .anyRequest().authenticated())
            .addFilterBefore(internalSecurityFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
