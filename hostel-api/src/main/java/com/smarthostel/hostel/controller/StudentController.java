package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.Student;
import com.smarthostel.hostel.entity.User;
import com.smarthostel.hostel.repository.UserRepository;
import com.smarthostel.hostel.service.StudentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/students")
public class StudentController {

	private final StudentService studentService;
	private final UserRepository userRepository;

	public StudentController(StudentService studentService, UserRepository userRepository) {
		this.studentService = studentService;
		this.userRepository = userRepository;
	}

	private boolean isAuthorizedForStudent(HttpServletRequest request, Long id) {
		String role = (String) request.getAttribute("userRole");
		if ("ADMIN".equals(role) || "SUPERADMIN".equals(role)) {
			return true;
		}
		if ("STUDENT".equals(role)) {
			Long userId = (Long) request.getAttribute("userId");
			Optional<User> userOpt = userRepository.findById(userId);
			return userOpt.isPresent() && id.equals(userOpt.get().getStudentId());
		}
		return false;
	}

	@GetMapping
	public ResponseEntity<?> list(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		return ResponseEntity.ok(studentService.findAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<?> get(HttpServletRequest request, @PathVariable Long id) {
		if (!isAuthorizedForStudent(request, id)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		return studentService.findById(id)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@GetMapping("/{id}/qr")
	public ResponseEntity<?> getQr(HttpServletRequest request, @PathVariable Long id) {
		if (!isAuthorizedForStudent(request, id)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		return studentService.getQrCodeBase64(id)
				.map(base64 -> ResponseEntity.ok(Map.of("qrBase64", base64, "contentType", "image/png")))
				.orElse(ResponseEntity.notFound().build());
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody Student student) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		try {
			Student created = studentService.create(student);
			return ResponseEntity.status(HttpStatus.CREATED).body(created);
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(ex.getMessage());
		}
	}

	@PutMapping("/{id}")
	public ResponseEntity<?> update(HttpServletRequest request, @PathVariable Long id, @RequestBody Student student) {
		if (!isAuthorizedForStudent(request, id)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		try {
			return studentService.update(id, student)
					.map(ResponseEntity::ok)
					.orElse(ResponseEntity.notFound().build());
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(ex.getMessage());
		}
	}

	@PutMapping("/{id}/pass-to-super")
	public ResponseEntity<?> passToSuper(HttpServletRequest request, @PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		Student updates = new Student();
		updates.setStatus("PENDING_SUPERADMIN");
		if (body != null && body.containsKey("roomId")) {
			Number rId = (Number) body.get("roomId");
			updates.setRoomId(rId != null ? rId.longValue() : null);
		}
		return studentService.update(id, updates)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@PutMapping("/{id}/finalize-allocation")
	public ResponseEntity<?> finalizeAllocation(HttpServletRequest request, @PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Only Super Admin can finalize allocations.");
		}
		Student updates = new Student();
		updates.setStatus("PENDING_PROFILE_SETUP");
		if (body != null && body.containsKey("roomId")) {
			Number rId = (Number) body.get("roomId");
			updates.setRoomId(rId != null ? rId.longValue() : null);
		}
		return studentService.update(id, updates)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@PutMapping("/{id}/submit-profile")
	public ResponseEntity<?> submitProfile(HttpServletRequest request, @PathVariable Long id, @RequestBody Student profile) {
		if (!isAuthorizedForStudent(request, id)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		try {
			profile.setStatus("PENDING_PROFILE_VERIFICATION");
			return studentService.update(id, profile)
					.map(ResponseEntity::ok)
					.orElse(ResponseEntity.notFound().build());
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(ex.getMessage());
		}
	}

	@PutMapping("/{id}/verify-profile")
	public ResponseEntity<?> verifyProfile(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		Student updates = new Student();
		updates.setStatus("ACTIVE");
		return studentService.update(id, updates)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@PutMapping("/{id}/reject")
	public ResponseEntity<?> reject(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		Student updates = new Student();
		updates.setStatus("REJECTED");
		return studentService.update(id, updates)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		studentService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
