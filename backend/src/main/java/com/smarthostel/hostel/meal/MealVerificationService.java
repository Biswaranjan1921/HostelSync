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

	public MealVerificationService(StudentRepository studentRepository,
			MealVerificationRepository verificationRepository,
			QrService qrService,
			com.smarthostel.hostel.leave.LeaveRequestRepository leaveRequestRepository) {
		this.studentRepository = studentRepository;
		this.verificationRepository = verificationRepository;
		this.qrService = qrService;
		this.leaveRequestRepository = leaveRequestRepository;
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

		// Dynamically compute meal slot from current server time
		java.time.LocalTime now = java.time.LocalTime.now(java.time.ZoneId.systemDefault());
		MealSlot computedSlot = null;

		// Breakfast: 9:00 AM to 11:00 AM
		if (!now.isBefore(java.time.LocalTime.of(9, 0)) && !now.isAfter(java.time.LocalTime.of(11, 0))) {
			computedSlot = MealSlot.BREAKFAST;
		}
		// Lunch: 12:30 PM to 2:30 PM
		else if (!now.isBefore(java.time.LocalTime.of(12, 30)) && !now.isAfter(java.time.LocalTime.of(14, 30))) {
			computedSlot = MealSlot.LUNCH;
		}
		// Dinner: 7:30 PM to 9:30 PM
		else if (!now.isBefore(java.time.LocalTime.of(19, 30)) && !now.isAfter(java.time.LocalTime.of(21, 30))) {
			computedSlot = MealSlot.DINNER;
		}

		if (computedSlot == null) {
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: Meal scanning is currently closed. Active dining windows: Breakfast (9-11 AM), Lunch (12:30-2:30 PM), Dinner (7:30-9:30 PM). Verification denied.");
		}

		LocalDate today = LocalDate.now(ZoneId.systemDefault());

		// Check if student is on leave today
		if (leaveRequestRepository.countActiveLeaves(student.getId(), today) > 0) {
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: Student (ID: #" + student.getId() + ") is on approved leave today. Dining access is suspended. Verification denied.");
		}

		Optional<MealVerification> existing = verificationRepository
				.findByStudentIdAndMealSlotAndVerificationDate(student.getId(), computedSlot, today);
		if (existing.isPresent()) {
			return VerifyMealResponse.fail("FORMAL REJECTION NOTICE: Meal access has already been verified for " + computedSlot + " today. Duplicate scan attempt rejected.");
		}

		MealVerification verification = new MealVerification();
		verification.setStudentId(student.getId());
		verification.setMealSlot(computedSlot);
		verification.setVerificationDate(today);
		verification.setVerifiedAt(Instant.now());
		verificationRepository.save(verification);

		return VerifyMealResponse.ok(
				student.getId(),
				student.getName(),
				computedSlot,
				today,
				verification.getVerifiedAt()
		);
	}

	public List<java.util.Map<String, Object>> getRecentVerifications(int limit) {
		List<MealVerification> list = verificationRepository
				.findByVerificationDateOrderByVerifiedAtDesc(LocalDate.now(), PageRequest.of(0, limit));
		
		return list.stream().map(m -> {
			java.util.Map<String, Object> map = new java.util.HashMap<>();
			map.put("id", m.getId());
			map.put("studentId", m.getStudentId());
			map.put("mealSlot", m.getMealSlot());
			map.put("verificationDate", m.getVerificationDate());
			map.put("verifiedAt", m.getVerifiedAt());
			
			studentRepository.findById(m.getStudentId()).ifPresent(s -> {
				map.put("studentName", s.getName());
			});
			return map;
		}).collect(java.util.stream.Collectors.toList());
	}

	public List<MealVerification> getVerificationsByStudent(Long studentId, int limit) {
		return verificationRepository
				.findByStudentIdOrderByVerificationDateDescVerifiedAtDesc(studentId, PageRequest.of(0, limit));
	}
}
