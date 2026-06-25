package com.smarthostel.hostel.service;

import com.smarthostel.hostel.dto.VerifyMealRequest;
import com.smarthostel.hostel.dto.VerifyMealResponse;
import com.smarthostel.hostel.entity.MealVerification;
import com.smarthostel.hostel.entity.Student;
import com.smarthostel.hostel.repository.MealVerificationRepository;
import com.smarthostel.hostel.repository.StudentRepository;
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

	public MealVerificationService(StudentRepository studentRepository,
			MealVerificationRepository verificationRepository,
			QrService qrService) {
		this.studentRepository = studentRepository;
		this.verificationRepository = verificationRepository;
		this.qrService = qrService;
	}

	@Transactional
	public VerifyMealResponse verifyMeal(VerifyMealRequest request) {
		String payload = request.getQrPayload();
		if (payload == null || payload.isBlank()) {
			return VerifyMealResponse.fail("Invalid QR payload.");
		}

		String token = payload.trim();
		if (token.matches("^ST-[A-Z0-9]+-[0-9]{8}$")) {
			String[] parts = token.split("-");
			String baseToken = parts[0] + "-" + parts[1];
			String dateStr = parts[2];

			String todayStr = java.time.LocalDate.now().toString().replace("-", "");
			if (!todayStr.equals(dateStr)) {
				return VerifyMealResponse.fail("QR code has expired. Please refresh the QR code on your dashboard.");
			}
			token = baseToken;
		}

		Optional<Student> studentOpt = studentRepository.findByQrToken(token);
		if (studentOpt.isEmpty()) {
			return VerifyMealResponse.fail("Student not found for this QR code.");
		}

		Student student = studentOpt.get();
		if (!student.isActive()) {
			return VerifyMealResponse.fail("Student account is inactive.");
		}

		// Dynamically compute meal slot from current server time
		java.time.LocalTime now = java.time.LocalTime.now(java.time.ZoneId.systemDefault());
		com.smarthostel.hostel.entity.MealSlot computedSlot = null;

		// Breakfast: 9:00 AM to 11:00 AM
		if (!now.isBefore(java.time.LocalTime.of(9, 0)) && !now.isAfter(java.time.LocalTime.of(11, 0))) {
			computedSlot = com.smarthostel.hostel.entity.MealSlot.BREAKFAST;
		}
		// Lunch: 12:30 PM to 2:30 PM
		else if (!now.isBefore(java.time.LocalTime.of(12, 30)) && !now.isAfter(java.time.LocalTime.of(14, 30))) {
			computedSlot = com.smarthostel.hostel.entity.MealSlot.LUNCH;
		}
		// Dinner: 7:30 PM to 9:30 PM
		else if (!now.isBefore(java.time.LocalTime.of(19, 30)) && !now.isAfter(java.time.LocalTime.of(21, 30))) {
			computedSlot = com.smarthostel.hostel.entity.MealSlot.DINNER;
		}

		if (computedSlot == null) {
			return VerifyMealResponse.fail("Meal scanning is closed. Active slots: Breakfast (9-11 AM), Lunch (12:30-2:30 PM), Dinner (7:30-9:30 PM)");
		}

		LocalDate today = LocalDate.now(ZoneId.systemDefault());
		Optional<MealVerification> existing = verificationRepository
				.findByStudentIdAndMealSlotAndVerificationDate(student.getId(), computedSlot, today);
		if (existing.isPresent()) {
			return VerifyMealResponse.fail("Meal already verified for " + computedSlot + " today.");
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

	public List<MealVerification> getRecentVerifications(int limit) {
		return verificationRepository
				.findByVerificationDateOrderByVerifiedAtDesc(LocalDate.now(), PageRequest.of(0, limit));
	}

	public List<MealVerification> getVerificationsByStudent(Long studentId, int limit) {
		return verificationRepository
				.findByStudentIdOrderByVerificationDateDescVerifiedAtDesc(studentId, PageRequest.of(0, limit));
	}
}
