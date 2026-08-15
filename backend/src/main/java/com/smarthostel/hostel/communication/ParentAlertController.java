package com.smarthostel.hostel.communication;

import com.smarthostel.hostel.communication.ParentAlert;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.communication.ParentAlertRepository;
import com.smarthostel.hostel.auth.UserRepository;
import com.smarthostel.hostel.communication.ParentNotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/parent-alerts")
public class ParentAlertController {

	private final ParentAlertRepository parentAlertRepository;
	private final UserRepository userRepository;
	private final ParentNotificationService parentNotificationService;

	public ParentAlertController(ParentAlertRepository parentAlertRepository,
								UserRepository userRepository,
								ParentNotificationService parentNotificationService) {
		this.parentAlertRepository = parentAlertRepository;
		this.userRepository = userRepository;
		this.parentNotificationService = parentNotificationService;
	}

	@GetMapping
	public ResponseEntity<?> list(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if ("SUPERADMIN".equals(role) || "ADMIN".equals(role)) {
			return ResponseEntity.ok(parentAlertRepository.findAllByOrderBySentAtDesc());
		} else if ("STUDENT".equals(role)) {
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
				return ResponseEntity.ok(parentAlertRepository.findByStudentId(userOpt.get().getStudentId()));
			}
			return ResponseEntity.ok(List.of());
		}
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
	}

	@PostMapping
	public ResponseEntity<?> sendAlert(HttpServletRequest request, @RequestBody Map<String, Object> body) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role) && !"ADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin or Superintendent can dispatch alerts to parents");
		}

		if (!body.containsKey("studentId") || !body.containsKey("category") || !body.containsKey("message")) {
			return ResponseEntity.badRequest().body("Missing studentId, category, or message in request body");
		}

		Long studentId = ((Number) body.get("studentId")).longValue();
		String category = (String) body.get("category");
		String message = (String) body.get("message");

		boolean success = parentNotificationService.sendAlert(studentId, category, message);
		if (success) {
			return ResponseEntity.ok(Map.of("message", "Parent alert sent successfully"));
		} else {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to dispatch alert (student not found or no contact info)");
		}
	}
}
