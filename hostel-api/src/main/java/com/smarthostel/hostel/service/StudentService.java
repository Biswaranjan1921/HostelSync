package com.smarthostel.hostel.service;

import com.smarthostel.hostel.entity.Student;
import com.smarthostel.hostel.entity.Payment;
import com.smarthostel.hostel.repository.PaymentRepository;
import com.smarthostel.hostel.repository.RoomRepository;
import com.smarthostel.hostel.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

	private final StudentRepository studentRepository;
	private final RoomRepository roomRepository;
	private final QrService qrService;
	private final AuthService authService;
	private final PaymentRepository paymentRepository;

	public StudentService(StudentRepository studentRepository,
			RoomRepository roomRepository,
			QrService qrService,
			AuthService authService,
			PaymentRepository paymentRepository) {
		this.studentRepository = studentRepository;
		this.roomRepository = roomRepository;
		this.qrService = qrService;
		this.authService = authService;
		this.paymentRepository = paymentRepository;
	}

	public List<Student> findAll() { return studentRepository.findAll(); }
	public List<Student> findByRoom(Long roomId) { return studentRepository.findByRoomId(roomId); }
	public Optional<Student> findById(Long id) { return studentRepository.findById(id); }
	public Optional<Student> findByQrToken(String qrToken) { return studentRepository.findByQrToken(qrToken); }

	@Transactional
	public Student create(Student student) {
		if (student.getEmail() != null && student.getParentEmail() != null && student.getEmail().trim().equalsIgnoreCase(student.getParentEmail().trim())) {
			throw new IllegalArgumentException("Student email and parent/guardian email cannot be the same.");
		}
		if (student.getPhone() != null && student.getParentPhone() != null && student.getPhone().trim().equals(student.getParentPhone().trim())) {
			throw new IllegalArgumentException("Student phone number and parent/guardian phone number cannot be the same.");
		}
		if (student.getQrToken() == null || student.getQrToken().isBlank()) {
			student.setQrToken("ST-" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
		}
		if (student.getStatus() == null || student.getStatus().isBlank()) {
			student.setStatus("PENDING_ADMIN");
		}
		return studentRepository.save(student);
	}

	@Transactional
	public Optional<Student> update(Long id, Student updates) {
		return studentRepository.findById(id).map(existing -> {
			String oldStatus = existing.getStatus();
			
			String studentEmail = updates.getEmail() != null ? updates.getEmail() : existing.getEmail();
			String parentEmail = updates.getParentEmail() != null ? updates.getParentEmail() : existing.getParentEmail();
			if (studentEmail != null && parentEmail != null && studentEmail.trim().equalsIgnoreCase(parentEmail.trim())) {
				throw new IllegalArgumentException("Student email and parent/guardian email cannot be the same.");
			}

			String studentPhone = updates.getPhone() != null ? updates.getPhone() : existing.getPhone();
			String parentPhone = updates.getParentPhone() != null ? updates.getParentPhone() : existing.getParentPhone();
			if (studentPhone != null && parentPhone != null && studentPhone.trim().equals(parentPhone.trim())) {
				throw new IllegalArgumentException("Student phone number and parent/guardian phone number cannot be the same.");
			}

			if (updates.getName() != null) existing.setName(updates.getName());
			if (updates.getEmail() != null) existing.setEmail(updates.getEmail());
			if (updates.getPhone() != null) existing.setPhone(updates.getPhone());
			if (updates.getDepartment() != null) existing.setDepartment(updates.getDepartment());
			if (updates.getYear() != null) existing.setYear(updates.getYear());
			if (updates.getPhotoBase64() != null) existing.setPhotoBase64(updates.getPhotoBase64());
			if (updates.getParentName() != null) existing.setParentName(updates.getParentName());
			if (updates.getParentPhone() != null) existing.setParentPhone(updates.getParentPhone());
			if (updates.getParentEmail() != null) existing.setParentEmail(updates.getParentEmail());
			if (updates.getStatus() != null) existing.setStatus(updates.getStatus());

			String newStatus = existing.getStatus();
			
			// Detect transition from applied to finalized by Super Admin
			boolean becomingFinalized = ("PENDING_ADMIN".equals(oldStatus) || "PENDING_SUPERADMIN".equals(oldStatus))
					&& ("PENDING_PROFILE_SETUP".equals(newStatus) || "ACTIVE".equals(newStatus));
			
			if (becomingFinalized) {
				// 1. Create User account so student can log in
				authService.createOrUpdateStudentUser(existing.getId(), existing.getEmail(), existing.getPhone(), existing.getName());
				
				// 2. Generate initial hostel fee invoice
				Payment initialFee = new Payment(existing.getId(), existing.getName(), 1200.0, LocalDate.now().plusDays(15), "PENDING");
				paymentRepository.save(initialFee);
				
				// 3. Increment pre-allocated room occupancy
				if (existing.getRoomId() != null) {
					roomRepository.findById(existing.getRoomId()).ifPresent(room -> {
						room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
						room.setStatus(room.getCurrentOccupancy() >= room.getCapacity() ? "FULL" : "AVAILABLE");
						roomRepository.save(room);
					});
				}
			}

			// Room change logic for already-finalized students
			boolean isAlreadyFinalized = !"PENDING_ADMIN".equals(oldStatus) && !"PENDING_SUPERADMIN".equals(oldStatus) && !"REJECTED".equals(oldStatus);
			if (isAlreadyFinalized) {
				Long oldRoomId = existing.getRoomId();
				Long newRoomId = updates.getRoomId();
				
				if (newRoomId != null && !newRoomId.equals(oldRoomId)) {
					// Decrement old
					if (oldRoomId != null) {
						roomRepository.findById(oldRoomId).ifPresent(room -> {
							room.setCurrentOccupancy(Math.max(0, room.getCurrentOccupancy() - 1));
							room.setStatus(room.getCurrentOccupancy() >= room.getCapacity() ? "FULL" : "AVAILABLE");
							roomRepository.save(room);
						});
					}
					// Increment new
					roomRepository.findById(newRoomId).ifPresent(room -> {
						room.setCurrentOccupancy(room.getCurrentOccupancy() + 1);
						room.setStatus(room.getCurrentOccupancy() >= room.getCapacity() ? "FULL" : "AVAILABLE");
						roomRepository.save(room);
					});
					existing.setRoomId(newRoomId);
				} else if (updates.getRoomId() == null && oldRoomId != null) {
					// Vacated
					roomRepository.findById(oldRoomId).ifPresent(room -> {
						room.setCurrentOccupancy(Math.max(0, room.getCurrentOccupancy() - 1));
						room.setStatus(room.getCurrentOccupancy() >= room.getCapacity() ? "FULL" : "AVAILABLE");
						roomRepository.save(room);
					});
					existing.setRoomId(null);
				}
			} else {
				// Just pre-allocate room field (Superintendent pre-allocation)
				if (updates.getRoomId() != null) {
					existing.setRoomId(updates.getRoomId());
				}
			}

			Student saved = studentRepository.save(existing);
			
			// Sync changes to User details if User exists
			if (isAlreadyFinalized || becomingFinalized) {
				authService.createOrUpdateStudentUser(saved.getId(), saved.getEmail(), saved.getPhone(), saved.getName());
			}
			
			return saved;
		});
	}

	public Optional<String> getQrCodeBase64(Long studentId) {
		return studentRepository.findById(studentId)
				.map(s -> qrService.generateQrBase64(s.getQrToken()));
	}

	@Transactional
	public void delete(Long id) {
		studentRepository.findById(id).ifPresent(student -> {
			if (student.getRoomId() != null) {
				roomRepository.findById(student.getRoomId()).ifPresent(room -> {
					room.setCurrentOccupancy(Math.max(0, room.getCurrentOccupancy() - 1));
					room.setStatus(room.getCurrentOccupancy() >= room.getCapacity() ? "FULL" : "AVAILABLE");
					roomRepository.save(room);
				});
			}
		});
		authService.deleteStudentUser(id);
		studentRepository.deleteById(id);
	}
}
