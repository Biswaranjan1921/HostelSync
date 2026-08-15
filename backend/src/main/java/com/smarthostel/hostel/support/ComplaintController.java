package com.smarthostel.hostel.support;

import com.smarthostel.hostel.support.Complaint;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.auth.UserRepository;
import com.smarthostel.hostel.support.ComplaintService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

	private final ComplaintService complaintService;
	private final UserRepository userRepository;
	private final com.smarthostel.hostel.student.StudentRepository studentRepository;

	public ComplaintController(ComplaintService complaintService, UserRepository userRepository, com.smarthostel.hostel.student.StudentRepository studentRepository) {
		this.complaintService = complaintService;
		this.userRepository = userRepository;
		this.studentRepository = studentRepository;
	}

	@GetMapping
	public ResponseEntity<List<Complaint>> list(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if ("STUDENT".equals(role)) {
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
				return ResponseEntity.ok(complaintService.findByStudentId(userOpt.get().getStudentId()));
			}
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}

		List<Complaint> all = complaintService.findAll();
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
					.filter(c -> studentIds.contains(c.getStudentId()))
					.collect(java.util.stream.Collectors.toList());
		}

		return ResponseEntity.ok(all);
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody Complaint complaint) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if (!"STUDENT".equals(role)) {
			return ResponseEntity.badRequest().body("Only students can file complaints");
		}

		Optional<User> userOpt = userRepository.findById(userId);
		if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
			complaint.setStudentId(userOpt.get().getStudentId());
			complaint.setStudentName(userOpt.get().getName());
			Complaint created = complaintService.create(complaint);
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
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can update complaint status");
		}

		if (!"OPEN".equals(status) && !"RESOLVED".equals(status)) {
			return ResponseEntity.badRequest().body("Invalid status value");
		}

		return complaintService.updateStatus(id, status)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}
}
