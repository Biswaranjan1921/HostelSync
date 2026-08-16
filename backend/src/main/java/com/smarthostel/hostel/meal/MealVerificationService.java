package com.smarthostel.hostel.meal;

import com.smarthostel.hostel.meal.VerifyMealRequest;
import com.smarthostel.hostel.meal.VerifyMealResponse;
import com.smarthostel.hostel.meal.MealVerification;
import com.smarthostel.hostel.student.QrService;
import com.smarthostel.hostel.student.Student;
import com.smarthostel.hostel.meal.MealVerificationRepository;
import com.smarthostel.hostel.student.StudentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class MealVerificationService {

	private final StudentRepository studentRepository;
	private final MealVerificationRepository verificationRepository;
	private final QrService qrService;
	private final com.smarthostel.hostel.leave.LeaveRequestRepository leaveRequestRepository;
	private final com.smarthostel.hostel.room.RoomRepository roomRepository;

	public MealVerificationService(StudentRepository studentRepository,
			MealVerificationRepository verificationRepository,
			QrService qrService,
			com.smarthostel.hostel.leave.LeaveRequestRepository leaveRequestRepository,
			com.smarthostel.hostel.room.RoomRepository roomRepository) {
		this.studentRepository = studentRepository;
		this.verificationRepository = verificationRepository;
		this.qrService = qrService;
		this.leaveRequestRepository = leaveRequestRepository;
		this.roomRepository = roomRepository;
	}

	@Transactional
	public VerifyMealResponse verifyMeal(VerifyMealRequest request) {
		String payload = request.getQrPayload();
		if (payload == null || payload.isBlank()) {
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: The QR payload provided is empty or invalid. Verification denied.");
		}

		String token = payload.trim();
		if (token.contains("-")) {
			int lastDash = token.lastIndexOf("-");
			String suffix = token.substring(lastDash + 1);
			if (suffix.matches("^[0-9]{8}$")) {
				String todayStr = java.time.LocalDate.now().toString().replace("-", "");
				if (!todayStr.equals(suffix)) {
					return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: The scanned QR Pass has expired for today's date (Pass date: " + suffix + ", Today: " + todayStr + "). Daily unique QR passes rotate at midnight. Verification denied.");
				}
				token = token.substring(0, lastDash);
			}
		}

		Optional<Student> studentOpt = studentRepository.findByQrToken(token);
		if (studentOpt.isEmpty()) {
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: No student record found matching this QR Pass token. Verification denied.");
		}

		Student student = studentOpt.get();
		if (!student.isActive()) {
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: Student account (ID: #" + student.getId() + ") is inactive. Dining access denied.");
		}

		// Dynamically compute meal slot based on explicit request override or exact/nearest time window in IST (Asia/Kolkata)
		java.time.ZoneId hostelZone = java.time.ZoneId.of("Asia/Kolkata");
		java.time.LocalTime now = java.time.LocalTime.now(hostelZone);
		LocalDate today = LocalDate.now(hostelZone);
		MealSlot computedSlot = request.getMealSlot();

		if (computedSlot == null) {
			// Cross-Midnight Late Night Dinner Shift (00:00 AM to 02:30 AM)
			if (now.isBefore(java.time.LocalTime.of(2, 30))) {
				computedSlot = MealSlot.DINNER;
				today = today.minusDays(1); // Belongs to previous day's operational dinner shift
			}
			// Breakfast: 8:00 AM (08:00) to 10:00 AM (10:00)
			else if (!now.isBefore(java.time.LocalTime.of(8, 0)) && !now.isAfter(java.time.LocalTime.of(10, 0))) {
				computedSlot = MealSlot.BREAKFAST;
			}
			// Lunch: 11:30 AM (11:30) to 2:00 PM (14:00)
			else if (!now.isBefore(java.time.LocalTime.of(11, 30)) && !now.isAfter(java.time.LocalTime.of(14, 0))) {
				computedSlot = MealSlot.LUNCH;
			}
			// Dinner: 8:00 PM (20:00) to 10:00 PM (22:00)
			else if (!now.isBefore(java.time.LocalTime.of(20, 0)) && !now.isAfter(java.time.LocalTime.of(22, 0))) {
				computedSlot = MealSlot.DINNER;
			}
			// Seamless window fallback for off-peak testing (e.g. evening 7pm -> Dinner)
			else if (!now.isBefore(java.time.LocalTime.of(16, 30))) {
				computedSlot = MealSlot.DINNER;
			} else if (!now.isBefore(java.time.LocalTime.of(10, 30))) {
				computedSlot = MealSlot.LUNCH;
			} else {
				computedSlot = MealSlot.BREAKFAST;
			}
		}

		// Check if student is on approved leave today
		if (leaveRequestRepository.countActiveLeaves(student.getId(), today) > 0) {
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: Student " + student.getName() + " (ID: #" + student.getId() + ") is on approved leave today. Dining access is suspended.");
		}

		// Strict Once-Per-Slot Verification Check
		Optional<MealVerification> existing = verificationRepository
				.findByStudentIdAndMealSlotAndVerificationDate(student.getId(), computedSlot, today);
		if (existing.isPresent()) {
			String verifiedTimeStr = java.time.format.DateTimeFormatter.ofPattern("hh:mm:ss a")
					.withZone(hostelZone)
					.format(existing.get().getVerifiedAt());
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: Meal pass for " + student.getName() + " (Token: " + student.getQrToken() + ") HAS ALREADY BEEN VERIFIED for " + computedSlot + " today at " + verifiedTimeStr + ". This meal has already been taken and cannot be scanned again.");
		}

		MealVerification verification = new MealVerification();
		verification.setStudentId(student.getId());
		verification.setMealSlot(computedSlot);
		verification.setVerificationDate(today);
		verification.setVerifiedAt(Instant.now());

		try {
			verificationRepository.save(verification);
		} catch (org.springframework.dao.DataIntegrityViolationException dive) {
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: Concurrent scan detected. Meal pass for " + student.getName() + " HAS ALREADY BEEN VERIFIED for " + computedSlot + " today.");
		}

		String formatTime = java.time.format.DateTimeFormatter.ofPattern("hh:mm:ss a")
				.withZone(hostelZone)
				.format(verification.getVerifiedAt());

		VerifyMealResponse response = VerifyMealResponse.ok(
				student.getId(),
				student.getName(),
				computedSlot,
				today,
				verification.getVerifiedAt()
		);
		response.setMessage("MEAL VERIFIED SUCCESSFULLY! Student: " + student.getName() + " | Token: " + student.getQrToken() + " | Meal: " + computedSlot + " | Time: " + formatTime);
		return response;
	}

	public List<java.util.Map<String, Object>> getRecentVerifications(int limit) {
		List<MealVerification> list = verificationRepository
				.findByOrderByVerifiedAtDesc(PageRequest.of(0, limit));
		
		return list.stream().map(m -> {
			java.util.Map<String, Object> map = new java.util.HashMap<>();
			map.put("id", m.getId());
			map.put("studentId", m.getStudentId());
			map.put("mealSlot", m.getMealSlot());
			map.put("verificationDate", m.getVerificationDate());
			map.put("verifiedAt", m.getVerifiedAt());
			
			studentRepository.findById(m.getStudentId()).ifPresent(s -> {
				map.put("studentName", s.getName());
				map.put("department", s.getDepartment());
				map.put("phone", s.getPhone());
				if (s.getPhotoBase64() != null) {
					map.put("photoBase64", s.getPhotoBase64());
				}
				if (s.getRoomId() != null) {
					roomRepository.findById(s.getRoomId()).ifPresent(r -> {
						map.put("roomNumber", r.getNumber());
					});
				}
			});
			return map;
		}).collect(java.util.stream.Collectors.toList());
	}

	public List<MealVerification> getVerificationsByStudent(Long studentId, int limit) {
		return verificationRepository
				.findByStudentIdOrderByVerificationDateDescVerifiedAtDesc(studentId, PageRequest.of(0, limit));
	}
}
