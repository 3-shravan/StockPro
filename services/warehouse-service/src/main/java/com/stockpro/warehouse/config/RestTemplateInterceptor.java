package com.stockpro.warehouse.config;

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
            propagateHeader(inbound, outbound, "Authorization");
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
