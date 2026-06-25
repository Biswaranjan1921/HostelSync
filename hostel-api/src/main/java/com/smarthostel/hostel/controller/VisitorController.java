package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.User;
import com.smarthostel.hostel.entity.Visitor;
import com.smarthostel.hostel.repository.UserRepository;
import com.smarthostel.hostel.repository.VisitorRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {

	private final VisitorRepository visitorRepository;
	private final UserRepository userRepository;

	public VisitorController(VisitorRepository visitorRepository, UserRepository userRepository) {
		this.visitorRepository = visitorRepository;
		this.userRepository = userRepository;
	}

	@GetMapping
	public ResponseEntity<?> list(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if ("STUDENT".equals(role)) {
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
				return ResponseEntity.ok(visitorRepository.findByStudentId(userOpt.get().getStudentId()));
			}
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}

		// Admins see all visitor registers
		return ResponseEntity.ok(visitorRepository.findAll());
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody Visitor visitor) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if ("STUDENT".equals(role)) {
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isEmpty() || userOpt.get().getStudentId() == null) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
			}
			User studentUser = userOpt.get();
			visitor.setStudentId(studentUser.getStudentId());
			visitor.setStudentName(studentUser.getName());
			visitor.setStatus("PENDING");
		} else {
			// Admin creating log directly
			if (visitor.getStatus() == null) {
				visitor.setStatus("APPROVED");
			}
			if ("APPROVED".equals(visitor.getStatus()) && visitor.getEntryTime() == null) {
				visitor.setEntryTime(LocalDateTime.now());
			}
		}

		return ResponseEntity.status(HttpStatus.CREATED).body(visitorRepository.save(visitor));
	}

	@PutMapping("/{id}/status")
	public ResponseEntity<?> updateStatus(HttpServletRequest request, @PathVariable Long id, @RequestParam String status) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}

		Optional<Visitor> visitorOpt = visitorRepository.findById(id);
		if (visitorOpt.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		Visitor visitor = visitorOpt.get();
		visitor.setStatus(status);

		if ("APPROVED".equals(status)) {
			visitor.setEntryTime(LocalDateTime.now());
		} else if ("COMPLETED".equals(status)) {
			visitor.setExitTime(LocalDateTime.now());
		}

		return ResponseEntity.ok(visitorRepository.save(visitor));
	}
}
