package com.stockpro.purchase.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;

/**
 * RestTemplateInterceptor — Propagates gateway context headers to downstream service calls.
 *
 * <p>When this service makes outbound HTTP calls to other internal services,
 * the API Gateway context headers (X-User-Name, X-User-Roles, X-User-Id,
 * X-Internal-Gateway-Secret) are forwarded so downstream services can also
 * authenticate and authorize the request properly.
 */
@Slf4j
@Component
public class RestTemplateInterceptor implements ClientHttpRequestInterceptor {

    private static final String GATEWAY_SECRET_HEADER = "X-Internal-Gateway-Secret";
    private static final String USER_NAME_HEADER      = "X-User-Name";
    private static final String USER_ROLES_HEADER     = "X-User-Roles";
    private static final String USER_ID_HEADER        = "X-User-Id";

    @org.springframework.beans.factory.annotation.Value("${stockpro.security.internal-secret}")
    private String gatewaySecret;

    @Override
    public ClientHttpResponse intercept(HttpRequest outbound,
                                        byte[] body,
                                        ClientHttpRequestExecution execution) throws IOException {

        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null) {
            HttpServletRequest inbound = attributes.getRequest();
            propagateHeader(inbound, outbound, GATEWAY_SECRET_HEADER);
            propagateHeader(inbound, outbound, USER_NAME_HEADER);
            propagateHeader(inbound, outbound, USER_ROLES_HEADER);
            propagateHeader(inbound, outbound, USER_ID_HEADER);
            propagateHeader(inbound, outbound, "X-User-Department");
            propagateHeader(inbound, outbound, "Authorization");
        }

        // Ensure Gateway Secret is ALWAYS present for internal calls, even if background/async
        if (!outbound.getHeaders().containsKey(GATEWAY_SECRET_HEADER)) {
            outbound.getHeaders().add(GATEWAY_SECRET_HEADER, gatewaySecret);
        }

        // Background/Scheduled tasks (no attributes) need a system context to pass filters
        if (attributes == null) {
            if (!outbound.getHeaders().containsKey(USER_NAME_HEADER)) {
                outbound.getHeaders().add(USER_NAME_HEADER, "system");
            }
            if (!outbound.getHeaders().containsKey(USER_ROLES_HEADER)) {
                outbound.getHeaders().add(USER_ROLES_HEADER, "ADMIN");
            }
        }

        return execution.execute(outbound, body);
    }

    private void propagateHeader(HttpServletRequest source, HttpRequest target, String name) {
        String value = source.getHeader(name);
        if (value != null && !target.getHeaders().containsKey(name)) {
            target.getHeaders().add(name, value);
        }
    }
}
