package com.stockpro.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stockpro.gateway.util.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * AuthenticationFilter — Centralized JWT authentication for the API Gateway.
 *
 * <p>
 * Applied to all protected routes. Responsibilities:
 * <ol>
 * <li>Extract and validate the {@code Authorization: Bearer <token>}
 * header.</li>
 * <li>On success: inject user context headers (X-User-Name, X-User-Roles,
 * X-User-Id,
 * X-Internal-Gateway-Secret) for downstream services.</li>
 * <li>On failure: return a structured JSON 401 response — never let the raw
 * error
 * through to the client.</li>
 * </ol>
 *
 * <p>
 * The {@code X-Internal-Gateway-Secret} header is stripped from incoming client
 * requests before routing to prevent external spoofing.
 */
@Slf4j
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private static final String GATEWAY_SECRET = "StockProGateway2024";
    private static final String GATEWAY_SECRET_HEADER = "X-Internal-Gateway-Secret";
    private static final String USER_NAME_HEADER = "X-User-Name";
    private static final String USER_ROLES_HEADER = "X-User-Roles";
    private static final String USER_ID_HEADER = "X-User-Id";

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Autowired
    private JwtUtil jwtUtil;

    public AuthenticationFilter() {
        super(Config.class);
    }

    public static class Config {
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // Allow OPTIONS requests for CORS preflight
            if (request.getMethod().name().equals("OPTIONS")) {
                return chain.filter(exchange);
            }

            // Strip any client-supplied internal secret (prevent spoofing)
            ServerHttpRequest sanitizedRequest = request.mutate()
                    .headers(h -> h.remove(GATEWAY_SECRET_HEADER))
                    .build();

            // Validate Authorization header
            String authHeader = sanitizedRequest.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Rejected [{}] — missing or malformed Authorization header",
                        sanitizedRequest.getPath());
                return reject(exchange, HttpStatus.UNAUTHORIZED,
                        "Authorization header missing or invalid. Use: Bearer <token>");
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.isTokenValid(token)) {
                log.warn("Rejected [{}] — invalid or expired JWT",
                        sanitizedRequest.getPath());
                return reject(exchange, HttpStatus.UNAUTHORIZED,
                        "Token is invalid or has expired. Please log in again.");
            }

            // Token valid — extract claims and inject downstream headers
            Claims claims = jwtUtil.extractAllClaims(token);
            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            String department = claims.get("department", String.class);
            Object userIdObj = claims.get("userId");
            String userId = userIdObj != null ? userIdObj.toString() : "";

            log.debug("Authenticated user={} role={} department={} for path={}", 
                    username, role, department, sanitizedRequest.getPath());

            ServerHttpRequest enrichedRequest = sanitizedRequest.mutate()
                    .header(USER_NAME_HEADER, username)
                    .header(USER_ROLES_HEADER, role != null ? role : "")
                    .header(USER_ID_HEADER, userId)
                    .header("X-User-Department", department != null ? department : "")
                    .header(GATEWAY_SECRET_HEADER, GATEWAY_SECRET)
                    .build();

            return chain.filter(exchange.mutate().request(enrichedRequest).build());
        };
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    private Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("message", message);
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("path", exchange.getRequest().getPath().value());

        byte[] bytes;
        try {
            bytes = MAPPER.writeValueAsBytes(body);
        } catch (JsonProcessingException e) {
            bytes = ("{\"status\":401,\"message\":\"" + message + "\"}").getBytes();
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
