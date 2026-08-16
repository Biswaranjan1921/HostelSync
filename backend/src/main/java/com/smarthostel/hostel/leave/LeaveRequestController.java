package com.smarthostel.hostel.leave;

import com.smarthostel.hostel.leave.LeaveRequest;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.auth.UserRepository;
import com.smarthostel.hostel.leave.LeaveRequestService;
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
	private final com.smarthostel.hostel.student.StudentRepository studentRepository;

	private final com.smarthostel.hostel.room.RoomRepository roomRepository;

	public LeaveRequestController(LeaveRequestService leaveRequestService, UserRepository userRepository, com.smarthostel.hostel.student.StudentRepository studentRepository, com.smarthostel.hostel.room.RoomRepository roomRepository) {
		this.leaveRequestService = leaveRequestService;
		this.userRepository = userRepository;
		this.studentRepository = studentRepository;
		this.roomRepository = roomRepository;
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
		
		List<LeaveRequest> all = leaveRequestService.findAll();
		if ("ADMIN".equals(role)) {
			Long adminHostelId = 1L;
			if (userId != null) {
				Optional<User> u = userRepository.findById(userId);
				if (u.isPresent() && u.get().getHostelId() != null) {
					adminHostelId = u.get().getHostelId();
				}
			}
			final Long targetHostelId = adminHostelId;
			java.util.Set<Long> studentIds = studentRepository.findAll().stream()
					.filter(s -> targetHostelId.equals(s.getHostelId()))
					.map(com.smarthostel.hostel.student.Student::getId)
					.collect(java.util.stream.Collectors.toSet());

			all = all.stream()
					.filter(l -> studentIds.contains(l.getStudentId()))
					.collect(java.util.stream.Collectors.toList());
		}

		return ResponseEntity.ok(all);
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

	@PostMapping("/verify-gatepass")
	public ResponseEntity<?> verifyGatePass(HttpServletRequest request, @RequestBody java.util.Map<String, String> body) {
		String role = (String) request.getAttribute("userRole");
		if (role == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired.");
		}
		String payload = body != null ? body.get("qrPayload") : null;
		java.util.Map<String, Object> result = leaveRequestService.verifyGatePass(payload, studentRepository, roomRepository);
		return ResponseEntity.ok(result);
	}
}
