package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.MessFeedback;
import com.smarthostel.hostel.entity.MessMenu;
import com.smarthostel.hostel.entity.User;
import com.smarthostel.hostel.repository.MessFeedbackRepository;
import com.smarthostel.hostel.repository.MessMenuRepository;
import com.smarthostel.hostel.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/mess")
public class MessController {

	private final MessMenuRepository menuRepository;
	private final MessFeedbackRepository feedbackRepository;
	private final UserRepository userRepository;

	public MessController(MessMenuRepository menuRepository,
			MessFeedbackRepository feedbackRepository,
			UserRepository userRepository) {
		this.menuRepository = menuRepository;
		this.feedbackRepository = feedbackRepository;
		this.userRepository = userRepository;
	}

	// MENU ENDPOINTS
	@GetMapping("/menu")
	public ResponseEntity<?> getMenu() {
		return ResponseEntity.ok(menuRepository.findAll());
	}

	@PutMapping("/menu")
	public ResponseEntity<?> updateMenu(HttpServletRequest request, @Valid @RequestBody MessMenu menu) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only administrators can update the menu");
		}

		Optional<MessMenu> existingOpt = menuRepository.findByDayOfWeek(menu.getDayOfWeek());
		if (existingOpt.isPresent()) {
			MessMenu existing = existingOpt.get();
			existing.setBreakfast(menu.getBreakfast());
			existing.setLunch(menu.getLunch());
			existing.setDinner(menu.getDinner());
			return ResponseEntity.ok(menuRepository.save(existing));
		} else {
			return ResponseEntity.ok(menuRepository.save(menu));
		}
	}

	// FEEDBACK ENDPOINTS
	@GetMapping("/feedback")
	public ResponseEntity<?> getFeedback(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		return ResponseEntity.ok(feedbackRepository.findAllByOrderByCreatedAtDesc());
	}

	@PostMapping("/feedback")
	public ResponseEntity<?> submitFeedback(HttpServletRequest request, @Valid @RequestBody MessFeedback feedback) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if (!"STUDENT".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can submit mess feedback");
		}

		Optional<User> userOpt = userRepository.findById(userId);
		if (userOpt.isEmpty() || userOpt.get().getStudentId() == null) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}

		User user = userOpt.get();
		feedback.setStudentId(user.getStudentId());
		feedback.setStudentName(user.getName());
		feedback.setCreatedAt(LocalDateTime.now());

		return ResponseEntity.status(HttpStatus.CREATED).body(feedbackRepository.save(feedback));
	}
}
