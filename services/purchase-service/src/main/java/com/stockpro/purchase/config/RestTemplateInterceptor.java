package com.stockpro.purchase.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;

/**
 * RestTemplateInterceptor extracts the JWT token from the original incoming request
 * and propagates it to all outgoing requests made by the Purchase Service.
 * 
 * Why: This ensures that our cross-service calls (to Warehouse or Product) 
 * are authorized under the same user context.
 */
@Component
public class RestTemplateInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
            throws IOException {
        
        // Use RequestContextHolder to get the current HttpServletRequest.
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        
        if (attributes != null) {
            HttpServletRequest currentRequest = attributes.getRequest();
            String authHeader = currentRequest.getHeader("Authorization");
            
            // If the incoming request has a Bearer token, forward it.
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                request.getHeaders().add("Authorization", authHeader);
            }
        }
        
        return execution.execute(request, body);
    }
}
