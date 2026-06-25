package com.smarthostel.hostel.service;

import com.smarthostel.hostel.entity.Room;
import com.smarthostel.hostel.entity.RoomAuditLog;
import com.smarthostel.hostel.repository.RoomRepository;
import com.smarthostel.hostel.repository.StudentRepository;
import com.smarthostel.hostel.repository.RoomAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class RoomService {

	private final RoomRepository roomRepository;
	private final StudentRepository studentRepository;
	private final RoomAuditLogRepository auditLogRepository;

	public RoomService(RoomRepository roomRepository, StudentRepository studentRepository, RoomAuditLogRepository auditLogRepository) {
		this.roomRepository = roomRepository;
		this.studentRepository = studentRepository;
		this.auditLogRepository = auditLogRepository;
	}

	public List<Room> findAll() { return roomRepository.findAll(); }
	public List<Room> findByBlock(String block) { return roomRepository.findByBlockOrderByNumber(block); }
	public Optional<Room> findById(Long id) { return roomRepository.findById(id); }

	@Transactional
	public Room create(Room room) {
		room.setCurrentOccupancy(0);
		return roomRepository.save(room);
	}

	@Transactional
	public Optional<Room> update(Long id, Room updates) {
		return roomRepository.findById(id).map(existing -> {
			if (updates.getBlock() != null) existing.setBlock(updates.getBlock());
			if (updates.getNumber() != null) existing.setNumber(updates.getNumber());
			if (updates.getCapacity() != null) existing.setCapacity(updates.getCapacity());
			if (updates.getFloor() != null) existing.setFloor(updates.getFloor());
			return roomRepository.save(existing);
		});
	}

	@Transactional
	public Optional<Room> overrideCapacity(Long id, Integer newCapacity, String changedBy) {
		return roomRepository.findById(id).map(existing -> {
			int oldCapacity = existing.getCapacity();
			existing.setCapacity(newCapacity);
			existing.setStatus(existing.getCurrentOccupancy() >= newCapacity ? "FULL" : "AVAILABLE");
			Room saved = roomRepository.save(existing);

			RoomAuditLog log = new RoomAuditLog(
					id,
					existing.getNumber(),
					oldCapacity,
					newCapacity,
					changedBy
			);
			auditLogRepository.save(log);
			return saved;
		});
	}

	public int getOccupancy(Long roomId) { return studentRepository.findByRoomId(roomId).size(); }
	public void delete(Long id) { roomRepository.deleteById(id); }

	public List<RoomAuditLog> findAllAuditLogs() {
		return auditLogRepository.findAllByOrderByChangedAtDesc();
	}
}
