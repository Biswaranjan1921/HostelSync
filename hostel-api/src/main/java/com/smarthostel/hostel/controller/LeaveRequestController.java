package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.LeaveRequest;
import com.smarthostel.hostel.entity.User;
import com.smarthostel.hostel.repository.UserRepository;
import com.smarthostel.hostel.service.LeaveRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {

	private final LeaveRequestService leaveRequestService;
	private final UserRepository userRepository;

	public LeaveRequestController(LeaveRequestService leaveRequestService, UserRepository userRepository) {
		this.leaveRequestService = leaveRequestService;
		this.userRepository = userRepository;
	}

	@GetMapping
	public ResponseEntity<List<LeaveRequest>> list(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");
		
		if ("STUDENT".equals(role)) {
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
				return ResponseEntity.ok(leaveRequestService.findByStudentId(userOpt.get().getStudentId()));
			}
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}
		
		// Admin and Superadmin see all requests
		return ResponseEntity.ok(leaveRequestService.findAll());
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody LeaveRequest leaveRequest) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");
		
		if (!"STUDENT".equals(role)) {
			return ResponseEntity.badRequest().body("Only students can apply for leaves");
		}

		Optional<User> userOpt = userRepository.findById(userId);
		if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
			leaveRequest.setStudentId(userOpt.get().getStudentId());
			leaveRequest.setStudentName(userOpt.get().getName());
			LeaveRequest created = leaveRequestService.create(leaveRequest);
			return ResponseEntity.status(HttpStatus.CREATED).body(created);
		}
		
		return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
	}

	@PutMapping("/{id}/status")
	public ResponseEntity<?> updateStatus(
			HttpServletRequest request,
			@PathVariable Long id,
			@RequestParam String status) {
		
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can approve/reject leaves");
		}

		if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
			return ResponseEntity.badRequest().body("Invalid status value");
		}

		return leaveRequestService.updateStatus(id, status)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}
}
