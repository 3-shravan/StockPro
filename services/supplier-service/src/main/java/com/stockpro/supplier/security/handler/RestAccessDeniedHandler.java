package com.stockpro.supplier.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockpro.supplier.common.response.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
public class RestAccessDeniedHandler implements AccessDeniedHandler {

  private static final ObjectMapper MAPPER = new ObjectMapper().findAndRegisterModules();

  @Override
  public void handle(HttpServletRequest request,
      HttpServletResponse response,
      AccessDeniedException accessDeniedException) throws IOException, ServletException {
    log.warn("Forbidden request at {}: {}", request.getRequestURI(), accessDeniedException.getMessage());
    response.setStatus(HttpStatus.FORBIDDEN.value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    MAPPER.writeValue(response.getWriter(),
      ApiResponse.error(HttpStatus.FORBIDDEN.value(), "Access denied due to insufficient permissions.",
        request.getRequestURI()));
  }
}
