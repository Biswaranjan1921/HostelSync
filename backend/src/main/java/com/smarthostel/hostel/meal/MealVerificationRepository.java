package com.smarthostel.hostel.meal;

import com.smarthostel.hostel.meal.MealSlot;
import com.smarthostel.hostel.meal.MealVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MealVerificationRepository extends JpaRepository<MealVerification, Long> {

	Optional<MealVerification> findByStudentIdAndMealSlotAndVerificationDate(
			Long studentId, MealSlot mealSlot, LocalDate date);

	List<MealVerification> findByStudentIdOrderByVerificationDateDescVerifiedAtDesc(Long studentId, org.springframework.data.domain.Pageable pageable);

	List<MealVerification> findByVerificationDateOrderByVerifiedAtDesc(LocalDate date, org.springframework.data.domain.Pageable pageable);

	long countByVerificationDateAndMealSlot(LocalDate date, MealSlot slot);

	List<MealVerification> findByStudentId(Long studentId);

	long countByVerificationDate(LocalDate date);
}
