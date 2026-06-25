package com.smarthostel.hostel.dto;

import com.smarthostel.hostel.entity.MealSlot;
import java.time.Instant;
import java.time.LocalDate;

public class VerifyMealResponse {

	private boolean success;
	private String message;
	private Long studentId;
	private String studentName;
	private MealSlot mealSlot;
	private LocalDate date;
	private Instant verifiedAt;

	public static VerifyMealResponse ok(Long studentId, String studentName, MealSlot slot, LocalDate date, Instant at) {
		VerifyMealResponse r = new VerifyMealResponse();
		r.setSuccess(true);
		r.setMessage("Meal verified successfully.");
		r.setStudentId(studentId);
		r.setStudentName(studentName);
		r.setMealSlot(slot);
		r.setDate(date);
		r.setVerifiedAt(at);
		return r;
	}

	public static VerifyMealResponse fail(String message) {
		VerifyMealResponse r = new VerifyMealResponse();
		r.setSuccess(false);
		r.setMessage(message);
		return r;
	}

	public boolean isSuccess() { return success; }
	public void setSuccess(boolean success) { this.success = success; }
	public String getMessage() { return message; }
	public void setMessage(String message) { this.message = message; }
	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }
	public String getStudentName() { return studentName; }
	public void setStudentName(String studentName) { this.studentName = studentName; }
	public MealSlot getMealSlot() { return mealSlot; }
	public void setMealSlot(MealSlot mealSlot) { this.mealSlot = mealSlot; }
	public LocalDate getDate() { return date; }
	public void setDate(LocalDate date) { this.date = date; }
	public Instant getVerifiedAt() { return verifiedAt; }
	public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
}
