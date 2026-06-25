package com.smarthostel.hostel.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "meal_verifications", uniqueConstraints = {
		@UniqueConstraint(columnNames = { "student_id", "meal_slot", "verification_date" })
})
public class MealVerification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "student_id", nullable = false)
	private Long studentId;

	@Enumerated(EnumType.STRING)
	@Column(name = "meal_slot", nullable = false)
	private MealSlot mealSlot;

	@Column(name = "verification_date", nullable = false)
	private LocalDate verificationDate;

	@Column(name = "verified_at", nullable = false)
	private Instant verifiedAt;

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }
	public MealSlot getMealSlot() { return mealSlot; }
	public void setMealSlot(MealSlot mealSlot) { this.mealSlot = mealSlot; }
	public LocalDate getVerificationDate() { return verificationDate; }
	public void setVerificationDate(LocalDate verificationDate) { this.verificationDate = verificationDate; }
	public Instant getVerifiedAt() { return verifiedAt; }
	public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
}
