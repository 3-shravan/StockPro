package com.stockpro.alert.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * InternalSecurityFilter — Gate-keeper for all inbound requests to this service.
 *
 * <p>Validates the presence of the {@code X-Internal-Gateway-Secret} header which
 * the API Gateway injects after performing JWT authentication. If the secret is
 * missing or wrong, the request is rejected immediately with a 401 JSON response.
 *
 * <p>Upon valid secret, it reconstructs the Spring Security context from the
 * {@code X-User-Name} and {@code X-User-Roles} headers forwarded by the Gateway,
 * enabling {@code @PreAuthorize} role checks on controllers.
 */
@Slf4j
@Component
public class InternalSecurityFilter extends OncePerRequestFilter {

    private static final String GATEWAY_SECRET_HEADER = "X-Internal-Gateway-Secret";
    private static final String EXPECTED_SECRET = "StockProGateway2024";
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Skip security check for actuator endpoints
        String path = request.getRequestURI();
        if (path.startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        String gatewaySecret = request.getHeader(GATEWAY_SECRET_HEADER);

        if (!EXPECTED_SECRET.equals(gatewaySecret)) {
            log.warn("Rejected request to {} — missing or invalid gateway secret", path);
            writeErrorResponse(response, HttpStatus.UNAUTHORIZED,
                    "Unauthorized: request must pass through the API Gateway.");
            return;
        }

        // Secret validated — reconstruct Security Context from gateway headers
        String username = request.getHeader("X-User-Name");
        String roles    = request.getHeader("X-User-Roles");
        String userId   = request.getHeader("X-User-Id");

        if (username != null && roles != null && !username.isBlank() && !roles.isBlank()) {
            List<SimpleGrantedAuthority> authorities = Arrays.stream(roles.split(","))
                    .map(String::trim)
                    .filter(r -> !r.isEmpty())
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);
            
            // Inject userId into details map
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("remoteAddress", request.getRemoteAddr());
            if (userId != null && !userId.isBlank()) {
                try {
                    details.put("userId", Integer.parseInt(userId));
                } catch (NumberFormatException ignored) {}
            }
            authentication.setDetails(details);
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Authenticated user={} id={} roles={} for path={}", username, userId, roles, path);
        } else {
            log.warn("Gateway secret present but user headers missing for path={}", path);
            writeErrorResponse(response, HttpStatus.UNAUTHORIZED,
                    "Unauthorized: user context headers missing.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeErrorResponse(HttpServletResponse response,
                                    HttpStatus status,
                                    String message) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("message", message);
        body.put("timestamp", LocalDateTime.now().toString());

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        MAPPER.writeValue(response.getWriter(), body);
    }
}
