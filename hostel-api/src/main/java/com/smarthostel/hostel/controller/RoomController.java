package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.Room;
import com.smarthostel.hostel.entity.RoomAuditLog;
import com.smarthostel.hostel.service.RoomService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

	private final RoomService roomService;

	public RoomController(RoomService roomService) {
		this.roomService = roomService;
	}

	@GetMapping
	public List<Room> list() { return roomService.findAll(); }

	@GetMapping("/{id}")
	public ResponseEntity<Room> get(@PathVariable Long id) {
		return roomService.findById(id)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@GetMapping("/audit-logs")
	public ResponseEntity<?> getAuditLogs(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role) && !"ADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		return ResponseEntity.ok(roomService.findAllAuditLogs());
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody Room room) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can create rooms");
		}
		Room created = roomService.create(room);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PutMapping("/{id}")
	public ResponseEntity<?> update(HttpServletRequest request, @PathVariable Long id, @RequestBody Room room) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can update rooms");
		}
		return roomService.update(id, room)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@PutMapping("/{id}/override-capacity")
	public ResponseEntity<?> overrideCapacity(HttpServletRequest request, @PathVariable Long id, @RequestBody Map<String, Object> body) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Only Super Admin can override seat capacity.");
		}
		if (!body.containsKey("capacity")) {
			return ResponseEntity.badRequest().body("Missing capacity in request body");
		}
		Integer capacity = ((Number) body.get("capacity")).intValue();
		String username = (String) request.getAttribute("username");
		if (username == null) {
			username = "superadmin";
		}
		return roomService.overrideCapacity(id, capacity, username)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can delete rooms");
		}
		roomService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
