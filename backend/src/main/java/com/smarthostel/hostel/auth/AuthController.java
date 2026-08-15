package com.smarthostel.hostel.auth;

import com.smarthostel.hostel.auth.LoginRequest;
import com.smarthostel.hostel.auth.LoginResponse;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.auth.UserSession;
import com.smarthostel.hostel.auth.UserRepository;
import com.smarthostel.hostel.auth.AuthService;
import com.smarthostel.hostel.communication.EmailService;
import org.apache.commons.codec.digest.DigestUtils;
import java.time.LocalDateTime;
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
	private final EmailService emailService;
	private final com.smarthostel.hostel.auth.StaffApplicationRepository staffApplicationRepository;

	public AuthController(AuthService authService, UserRepository userRepository, EmailService emailService, com.smarthostel.hostel.auth.StaffApplicationRepository staffApplicationRepository) {
		this.authService = authService;
		this.userRepository = userRepository;
		this.emailService = emailService;
		this.staffApplicationRepository = staffApplicationRepository;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
		Optional<String> tokenOpt = authService.login(request.getUsername(), request.getPassword());
		if (tokenOpt.isPresent()) {
			String token = tokenOpt.get();
			Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(request.getUsername());
			if (userOpt.isPresent()) {
				User user = userOpt.get();
				LoginResponse response = new LoginResponse(
						token,
						user.getUsername(),
						user.getRole(),
						user.getName(),
						user.getStudentId(),
						user.getHostelId()
				);
				return ResponseEntity.ok(response);
			}
		}
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
	}

	@PostMapping("/apply-staff")
	public ResponseEntity<?> applyStaff(@RequestBody com.smarthostel.hostel.auth.StaffApplication application) {
		if (application.getName() == null || application.getEmail() == null || application.getPhone() == null) {
			return ResponseEntity.badRequest().body("Missing required fields");
		}
		// Check requested role, default to ADMIN if invalid
		String requestedRole = application.getRole();
		if (!"ADMIN".equals(requestedRole) && !"CANTEEN_STAFF".equals(requestedRole)) {
			application.setRole("ADMIN");
		}
		application.setStatus("PENDING_SUPERADMIN");
		
		staffApplicationRepository.save(application);
		return ResponseEntity.ok("Staff application submitted");
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

	@PostMapping("/forgot-password")
	public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> payload) {
		String username = payload.get("username");
		if (username == null || username.isBlank()) {
			return ResponseEntity.badRequest().body("Username (email) is required");
		}
		
		Optional<User> userOpt = userRepository.findByUsername(username);
		if (userOpt.isPresent()) {
			User user = userOpt.get();
			String otp = String.format("%06d", new java.util.Random().nextInt(999999));
			user.setOtp(otp);
			user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
			userRepository.save(user);
			
			emailService.sendOtp(user.getUsername(), user.getName(), otp);
		}
		// Always return OK to prevent user enumeration
		return ResponseEntity.ok("If an account exists, an OTP has been sent.");
	}

	@PostMapping("/verify-otp")
	public ResponseEntity<?> verifyOtp(@RequestBody java.util.Map<String, String> payload) {
		String username = payload.get("username");
		String otp = payload.get("otp");
		String newPassword = payload.get("newPassword");
		
		if (username == null || otp == null || newPassword == null) {
			return ResponseEntity.badRequest().body("Missing parameters");
		}
		
		Optional<User> userOpt = userRepository.findByUsername(username);
		if (userOpt.isPresent()) {
			User user = userOpt.get();
			if (user.getOtp() != null && user.getOtp().equals(otp)) {
				if (user.getOtpExpiry().isAfter(LocalDateTime.now())) {
					user.setPassword(DigestUtils.sha256Hex(newPassword));
					user.setOtp(null);
					user.setOtpExpiry(null);
					userRepository.save(user);
					return ResponseEntity.ok("Password updated successfully");
				} else {
					return ResponseEntity.badRequest().body("OTP has expired");
				}
			}
		}
		return ResponseEntity.badRequest().body("Invalid OTP");
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
		// Limit to creating admins, canteen staff, or students
		if (!"ADMIN".equals(newUser.getRole()) && !"STUDENT".equals(newUser.getRole()) && !"CANTEEN_STAFF".equals(newUser.getRole())) {
			return ResponseEntity.badRequest().body("Can only create ADMIN, CANTEEN_STAFF, or STUDENT users");
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
