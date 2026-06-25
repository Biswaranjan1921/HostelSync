package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.dto.LoginRequest;
import com.smarthostel.hostel.dto.LoginResponse;
import com.smarthostel.hostel.entity.User;
import com.smarthostel.hostel.entity.UserSession;
import com.smarthostel.hostel.repository.UserRepository;
import com.smarthostel.hostel.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final UserRepository userRepository;

	public AuthController(AuthService authService, UserRepository userRepository) {
		this.authService = authService;
		this.userRepository = userRepository;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
		Optional<UserSession> sessionOpt = authService.login(request.getUsername(), request.getPassword());
		if (sessionOpt.isPresent()) {
			UserSession session = sessionOpt.get();
			Optional<User> userOpt = userRepository.findById(session.getUserId());
			if (userOpt.isPresent()) {
				User user = userOpt.get();
				LoginResponse response = new LoginResponse(
						session.getToken(),
						user.getUsername(),
						user.getRole(),
						user.getName(),
						user.getStudentId()
				);
				return ResponseEntity.ok(response);
			}
		}
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(HttpServletRequest request) {
		String authHeader = request.getHeader("Authorization");
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			String token = authHeader.substring(7);
			authService.logout(token);
		}
		return ResponseEntity.ok().build();
	}

	@GetMapping("/me")
	public ResponseEntity<?> me(HttpServletRequest request) {
		Long userId = (Long) request.getAttribute("userId");
		if (userId == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		return userRepository.findById(userId)
				.map(user -> ResponseEntity.ok(user))
				.orElse(ResponseEntity.notFound().build());
	}

	// SUPERADMIN: Manage Admin Users
	@GetMapping("/users")
	public ResponseEntity<?> listUsers(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can list users");
		}
		return ResponseEntity.ok(userRepository.findAll());
	}

	@PostMapping("/users")
	public ResponseEntity<?> createUser(HttpServletRequest request, @Valid @RequestBody User newUser) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can create admin users");
		}
		if (userRepository.findByUsername(newUser.getUsername()).isPresent()) {
			return ResponseEntity.badRequest().body("Username already exists");
		}
		// Limit to creating admins or students
		if (!"ADMIN".equals(newUser.getRole()) && !"STUDENT".equals(newUser.getRole())) {
			return ResponseEntity.badRequest().body("Can only create ADMIN or STUDENT users");
		}
		User saved = userRepository.save(newUser);
		return ResponseEntity.status(HttpStatus.CREATED).body(saved);
	}

	@DeleteMapping("/users/{id}")
	public ResponseEntity<?> deleteUser(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can delete admin users");
		}
		Optional<User> userOpt = userRepository.findById(id);
		if (userOpt.isEmpty()) {
			return ResponseEntity.notFound().build();
		}
		User user = userOpt.get();
		if ("SUPERADMIN".equals(user.getRole())) {
			return ResponseEntity.badRequest().body("Cannot delete the Super Admin account");
		}
		userRepository.deleteById(id);
		return ResponseEntity.noContent().build();
	}
}
