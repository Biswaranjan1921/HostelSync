package com.smarthostel.hostel.core;

import com.smarthostel.hostel.core.Staff;
import com.smarthostel.hostel.core.StaffRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

	private final StaffRepository staffRepository;

	public StaffController(StaffRepository staffRepository) {
		this.staffRepository = staffRepository;
	}

	@GetMapping
	public ResponseEntity<?> list(HttpServletRequest request) {
		// All authenticated roles can list staff members
		return ResponseEntity.ok(staffRepository.findAll());
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody Staff staff) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		return ResponseEntity.status(HttpStatus.CREATED).body(staffRepository.save(staff));
	}

	@PutMapping("/{id}")
	public ResponseEntity<?> update(HttpServletRequest request, @PathVariable Long id, @RequestBody Staff updates) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		return staffRepository.findById(id).map(staff -> {
			if (updates.getName() != null) staff.setName(updates.getName());
			if (updates.getRole() != null) staff.setRole(updates.getRole());
			if (updates.getPhone() != null) staff.setPhone(updates.getPhone());
			if (updates.getStatus() != null) staff.setStatus(updates.getStatus());
			return ResponseEntity.ok(staffRepository.save(staff));
		}).orElse(ResponseEntity.notFound().build());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		if (!staffRepository.existsById(id)) {
			return ResponseEntity.notFound().build();
		}
		staffRepository.deleteById(id);
		return ResponseEntity.noContent().build();
	}
}
