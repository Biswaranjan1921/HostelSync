package com.smarthostel.hostel.config;

import com.smarthostel.hostel.entity.UserSession;
import com.smarthostel.hostel.service.AuthService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
public class AuthFilter implements Filter {

	private final AuthService authService;

	public AuthFilter(AuthService authService) {
		this.authService = authService;
	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
			throws IOException, ServletException {
		
		HttpServletRequest httpRequest = (HttpServletRequest) request;
		HttpServletResponse httpResponse = (HttpServletResponse) response;

		String path = httpRequest.getRequestURI();
		String method = httpRequest.getMethod();

		// CORS preflight requests should always pass
		if ("OPTIONS".equalsIgnoreCase(method)) {
			chain.doFilter(request, response);
			return;
		}

		// Public endpoint: Auth login
		if (path.equals("/api/auth/login")) {
			chain.doFilter(request, response);
			return;
		}

		// Only protect endpoints starting with /api/
		if (path.startsWith("/api/")) {
			String authHeader = httpRequest.getHeader("Authorization");
			if (authHeader == null || !authHeader.startsWith("Bearer ")) {
				httpResponse.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
				return;
			}

			String token = authHeader.substring(7);
			Optional<UserSession> sessionOpt = authService.validateSession(token);

			if (sessionOpt.isEmpty()) {
				httpResponse.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Session expired or invalid");
				return;
			}

			UserSession session = sessionOpt.get();
			httpRequest.setAttribute("userId", session.getUserId());
			httpRequest.setAttribute("username", session.getUsername());
			httpRequest.setAttribute("userRole", session.getRole());
		}

		chain.doFilter(request, response);
	}
}
