package com.stockpro.alert.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;

import java.util.Collections;

/**
 * SecurityConfig — Minimal security for alert-service.
 *
 * <p>All JWT validation is handled by the API Gateway. This service trusts
 * the gateway-injected headers verified via InternalSecurityFilter.
 * Role-based access rules are enforced via @PreAuthorize on controllers.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final InternalSecurityFilter internalSecurityFilter;
    private final RestTemplateInterceptor restTemplateInterceptor;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/actuator/**").permitAll()
                    // Internal scheduler endpoints — callable only from gateway (verified by InternalSecurityFilter)
                    .requestMatchers("/api/v1/alerts/low-stock", "/api/v1/alerts/overstock").permitAll()
                    .anyRequest().authenticated())
            .addFilterBefore(internalSecurityFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setInterceptors(Collections.singletonList(restTemplateInterceptor));
        return restTemplate;
    }
}
