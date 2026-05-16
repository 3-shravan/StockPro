package com.stockpro.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

/**
 * GatewaySecretFilter — Injects the internal gateway secret into EVERY request.
 * 
 * <p>This filter is applied to both public and private routes. It ensures that 
 * downstream services can always verify the request originated from the gateway,
 * even for endpoints that don't require user authentication (like login).
 */
@Slf4j
@Component
public class GatewaySecretFilter extends AbstractGatewayFilterFactory<GatewaySecretFilter.Config> {

    @org.springframework.beans.factory.annotation.Value("${stockpro.security.internal-secret}")
    private String gatewaySecret;

    private static final String GATEWAY_SECRET_HEADER = "X-Internal-Gateway-Secret";

    public GatewaySecretFilter() {
        super(Config.class);
    }

    public static class Config {
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // Strip any client-supplied secret to prevent spoofing
            ServerHttpRequest enrichedRequest = request.mutate()
                    .headers(h -> h.remove(GATEWAY_SECRET_HEADER))
                    .header(GATEWAY_SECRET_HEADER, gatewaySecret)
                    .build();

            return chain.filter(exchange.mutate().request(enrichedRequest).build());
        };
    }
}
