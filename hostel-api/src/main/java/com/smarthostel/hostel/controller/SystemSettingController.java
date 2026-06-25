package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.SystemSetting;
import com.smarthostel.hostel.repository.SystemSettingRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/settings")
public class SystemSettingController {

	private final SystemSettingRepository systemSettingRepository;

	public SystemSettingController(SystemSettingRepository systemSettingRepository) {
		this.systemSettingRepository = systemSettingRepository;
	}

	@GetMapping
	public ResponseEntity<?> getAll() {
		return ResponseEntity.ok(systemSettingRepository.findAll());
	}

	@GetMapping("/{key}")
	public ResponseEntity<?> get(@PathVariable String key) {
		return systemSettingRepository.findById(key)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@PutMapping("/{key}")
	public ResponseEntity<?> update(HttpServletRequest request, @PathVariable String key, @RequestBody Map<String, String> body) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role) && !"ADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only administrators can update system settings");
		}

		String value = body.get("value");
		if (value == null) {
			return ResponseEntity.badRequest().body("Missing value in request body");
		}

		SystemSetting setting = new SystemSetting(key, value);
		return ResponseEntity.ok(systemSettingRepository.save(setting));
	}
}
