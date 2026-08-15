package com.smarthostel.hostel.auth;

import com.smarthostel.hostel.auth.AuthService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
public class AuthFilter implements Filter {

	private final AuthService authService;
	private final JwtUtil jwtUtil;

	public AuthFilter(AuthService authService, JwtUtil jwtUtil) {
		this.authService = authService;
		this.jwtUtil = jwtUtil;
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

			if (!jwtUtil.validateToken(token)) {
				httpResponse.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Session expired or invalid token");
				return;
			}

			Claims claims = jwtUtil.extractAllClaims(token);
			httpRequest.setAttribute("userId", claims.get("userId", Long.class));
			httpRequest.setAttribute("username", claims.getSubject());
			httpRequest.setAttribute("userRole", claims.get("role", String.class));
		}

		chain.doFilter(request, response);
	}
}
