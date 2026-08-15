package com.smarthostel.hostel.room;

import com.smarthostel.hostel.room.Room;
import com.smarthostel.hostel.room.RoomAuditLog;
import com.smarthostel.hostel.room.RoomService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.smarthostel.hostel.student.Student;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

	private final RoomService roomService;
	private final com.smarthostel.hostel.auth.UserRepository userRepository;

	public RoomController(RoomService roomService, com.smarthostel.hostel.auth.UserRepository userRepository) {
		this.roomService = roomService;
		this.userRepository = userRepository;
	}

	@GetMapping
	public List<Room> list(HttpServletRequest request) {
		List<Room> all = roomService.findAll();
		String role = (String) request.getAttribute("userRole");
		if ("ADMIN".equals(role)) {
			Long userId = (Long) request.getAttribute("userId");
			Long adminHostelId = 1L;
			if (userId != null) {
				Optional<com.smarthostel.hostel.auth.User> u = userRepository.findById(userId);
				if (u.isPresent() && u.get().getHostelId() != null) {
					adminHostelId = u.get().getHostelId();
				}
			}
			final Long targetHostelId = adminHostelId;
			return all.stream()
					.filter(r -> r.getHostelId() == null || targetHostelId.equals(r.getHostelId()))
					.collect(java.util.stream.Collectors.toList());
		}
		return all;
	}

	@GetMapping("/{id}")
	public ResponseEntity<Room> get(@PathVariable Long id) {
		return roomService.findById(id)
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	@GetMapping("/{id}/layout")
	public ResponseEntity<?> getLayout(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role) && !"ADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		Optional<Room> roomOpt = roomService.findById(id);
		if (roomOpt.isEmpty()) return ResponseEntity.notFound().build();
		Room room = roomOpt.get();
		List<Student> students = roomService.getStudentsInRoom(id);

		List<Map<String, Object>> beds = new ArrayList<>();
		for (int i = 1; i <= room.getCapacity(); i++) {
			final int bedIndex = i;
			Optional<Student> occupant = students.stream().filter(s -> s.getBedIndex() != null && s.getBedIndex() == bedIndex).findFirst();
			Map<String, Object> bed = new HashMap<>();
			bed.put("bedIndex", bedIndex);
			if (occupant.isPresent()) {
				bed.put("occupied", true);
				bed.put("studentId", occupant.get().getId());
				bed.put("studentName", occupant.get().getName());
			} else {
				bed.put("occupied", false);
			}
			beds.add(bed);
		}
		
		Map<String, Object> response = new HashMap<>();
		response.put("room", room);
		response.put("beds", beds);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/{id}/assign-bed")
	public ResponseEntity<?> assignBed(HttpServletRequest request, @PathVariable Long id, @RequestBody Map<String, Object> body) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role) && !"ADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		if (!body.containsKey("studentId") || !body.containsKey("bedIndex")) {
			return ResponseEntity.badRequest().body("Missing studentId or bedIndex");
		}
		Long studentId = ((Number) body.get("studentId")).longValue();
		Integer bedIndex = ((Number) body.get("bedIndex")).intValue();
		
		Optional<Room> roomOpt = roomService.findById(id);
		if (roomOpt.isEmpty()) return ResponseEntity.notFound().build();
		Room room = roomOpt.get();
		
		if (bedIndex < 1 || bedIndex > room.getCapacity()) {
		    return ResponseEntity.badRequest().body("Invalid bed index");
		}
		
		try {
		    roomService.assignBed(id, studentId, bedIndex);
		    return ResponseEntity.ok().build();
		} catch (Exception e) {
		    return ResponseEntity.badRequest().body(e.getMessage());
		}
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
			username = "SuperAdmin";
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
