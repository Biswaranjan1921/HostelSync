package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.Hostel;
import com.smarthostel.hostel.entity.Room;
import com.smarthostel.hostel.repository.HostelRepository;
import com.smarthostel.hostel.repository.RoomRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/hostels")
public class HostelController {

	private final HostelRepository hostelRepository;
	private final RoomRepository roomRepository;

	public HostelController(HostelRepository hostelRepository, RoomRepository roomRepository) {
		this.hostelRepository = hostelRepository;
		this.roomRepository = roomRepository;
	}

	@GetMapping
	public ResponseEntity<?> list(HttpServletRequest request) {
		// All authenticated users can view hostels
		return ResponseEntity.ok(hostelRepository.findAll());
	}

	@PostMapping
	@Transactional
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody Hostel hostel) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can create hostels");
		}
		if (hostelRepository.findByCode(hostel.getCode()).isPresent()) {
			return ResponseEntity.badRequest().body("Hostel code already exists");
		}
		
		Hostel savedHostel = hostelRepository.save(hostel);
		
		int totalFloors = savedHostel.getTotalFloors() != null ? savedHostel.getTotalFloors() : 1;
		int roomsPerFloor = savedHostel.getRoomsPerFloor() != null ? savedHostel.getRoomsPerFloor() : 10;
		int defaultCapacity = savedHostel.getDefaultCapacity() != null ? savedHostel.getDefaultCapacity() : 2;
		
		for (int floor = 1; floor <= totalFloors; floor++) {
			for (int roomIdx = 1; roomIdx <= roomsPerFloor; roomIdx++) {
				Room room = new Room();
				room.setBlock(savedHostel.getCode());
				room.setNumber(String.format("%s-%d%02d", savedHostel.getCode(), floor, roomIdx));
				room.setCapacity(defaultCapacity);
				room.setCurrentOccupancy(0);
				room.setFloor(String.valueOf(floor));
				room.setHostelId(savedHostel.getId());
				room.setStatus("AVAILABLE");
				roomRepository.save(room);
			}
		}
		
		return ResponseEntity.status(HttpStatus.CREATED).body(savedHostel);
	}

	@PutMapping("/{id}")
	public ResponseEntity<?> update(HttpServletRequest request, @PathVariable Long id, @RequestBody Hostel updates) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can update hostels");
		}
		return hostelRepository.findById(id).map(hostel -> {
			if (updates.getName() != null) hostel.setName(updates.getName());
			if (updates.getCode() != null) hostel.setCode(updates.getCode());
			if (updates.getAddress() != null) hostel.setAddress(updates.getAddress());
			if (updates.getType() != null) hostel.setType(updates.getType());
			return ResponseEntity.ok(hostelRepository.save(hostel));
		}).orElse(ResponseEntity.notFound().build());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can delete hostels");
		}
		if (!hostelRepository.existsById(id)) {
			return ResponseEntity.notFound().build();
		}
		hostelRepository.deleteById(id);
		return ResponseEntity.noContent().build();
	}
}
