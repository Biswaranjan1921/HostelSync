package com.smarthostel.hostel.meal;

import com.smarthostel.hostel.meal.VerifyMealRequest;
import com.smarthostel.hostel.meal.VerifyMealResponse;
import com.smarthostel.hostel.meal.MealVerification;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.auth.UserRepository;
import com.smarthostel.hostel.meal.MealVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/meal-verification")
public class MealVerificationController {

	private final MealVerificationService mealVerificationService;
	private final UserRepository userRepository;

	public MealVerificationController(MealVerificationService mealVerificationService, UserRepository userRepository) {
		this.mealVerificationService = mealVerificationService;
		this.userRepository = userRepository;
	}

	@PostMapping("/verify")
	public ResponseEntity<?> verify(HttpServletRequest request, @Valid @RequestBody VerifyMealRequest verifyRequest) {
		String role = (String) request.getAttribute("userRole");
		if (role == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired. Please log in again.");
		}
		VerifyMealResponse response = mealVerificationService.verifyMeal(verifyRequest);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/recent")
	public ResponseEntity<?> recent(HttpServletRequest request, @RequestParam(defaultValue = "20") int limit) {
		String role = (String) request.getAttribute("userRole");
		if (role == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired.");
		}
		return ResponseEntity.ok(mealVerificationService.getRecentVerifications(limit));
	}

	@GetMapping("/student/{studentId}")
	public ResponseEntity<?> byStudent(
			HttpServletRequest request,
			@PathVariable Long studentId,
			@RequestParam(defaultValue = "30") int limit) {
		
		String role = (String) request.getAttribute("userRole");
		if (role == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired.");
		}
		if ("STUDENT".equals(role)) {
			Long userId = (Long) request.getAttribute("userId");
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isEmpty() || !studentId.equals(userOpt.get().getStudentId())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
			}
		}

		return ResponseEntity.ok(mealVerificationService.getVerificationsByStudent(studentId, limit));
	}
}
