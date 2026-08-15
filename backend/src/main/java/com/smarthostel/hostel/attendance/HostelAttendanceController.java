package com.smarthostel.hostel.attendance;

import com.smarthostel.hostel.attendance.HostelAttendance;
import com.smarthostel.hostel.student.Student;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.attendance.HostelAttendanceRepository;
import com.smarthostel.hostel.student.StudentRepository;
import com.smarthostel.hostel.auth.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
public class HostelAttendanceController {

	private final HostelAttendanceRepository attendanceRepository;
	private final StudentRepository studentRepository;
	private final UserRepository userRepository;

	public HostelAttendanceController(HostelAttendanceRepository attendanceRepository,
			StudentRepository studentRepository,
			UserRepository userRepository) {
		this.attendanceRepository = attendanceRepository;
		this.studentRepository = studentRepository;
		this.userRepository = userRepository;
	}

	@PostMapping("/record")
	public ResponseEntity<?> recordAttendance(HttpServletRequest request, @RequestBody Map<String, String> body) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only administrators can record attendance");
		}

		String qrPayload = body.get("qrPayload");
		String direction = body.get("direction"); // ENTRY, EXIT

		if (qrPayload == null || qrPayload.isBlank() || direction == null || direction.isBlank()) {
			return ResponseEntity.badRequest().body("qrPayload and direction are required");
		}

		String qrToken = qrPayload.trim();
		if (qrToken.matches("^ST-[A-Z0-9]+-[0-9]{8}$")) {
			String[] parts = qrToken.split("-");
			qrToken = parts[0] + "-" + parts[1];
		}

		Optional<Student> studentOpt = studentRepository.findByQrToken(qrToken);
		if (studentOpt.isEmpty()) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found for the provided token");
		}

		Student student = studentOpt.get();
		if (!student.isActive()) {
			return ResponseEntity.badRequest().body("Student is marked inactive");
		}

		HostelAttendance log = new HostelAttendance();
		log.setStudentId(student.getId());
		log.setStudentName(student.getName());
		log.setDirection(direction.toUpperCase());
		log.setTimestamp(LocalDateTime.now());
		log.setMethod("QR_SCAN");

		HostelAttendance saved = attendanceRepository.save(log);

		return ResponseEntity.ok(Map.of(
				"success", true,
				"studentName", student.getName(),
				"direction", saved.getDirection(),
				"timestamp", saved.getTimestamp()
		));
	}

	@GetMapping("/recent")
	public ResponseEntity<?> getRecent(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if ("STUDENT".equals(role)) {
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
				return ResponseEntity.ok(attendanceRepository.findByStudentId(userOpt.get().getStudentId()));
			}
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}

		// Admins see all gate check-ins
		return ResponseEntity.ok(attendanceRepository.findAllByOrderByTimestampDesc());
	}
}
