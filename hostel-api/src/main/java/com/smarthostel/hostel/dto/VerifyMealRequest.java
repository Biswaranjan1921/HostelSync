package com.smarthostel.hostel.dto;

import com.smarthostel.hostel.entity.MealSlot;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VerifyMealRequest {

	@NotBlank
	private String qrPayload;

	private MealSlot mealSlot;

	public String getQrPayload() { return qrPayload; }
	public void setQrPayload(String qrPayload) { this.qrPayload = qrPayload; }
	public MealSlot getMealSlot() { return mealSlot; }
	public void setMealSlot(MealSlot mealSlot) { this.mealSlot = mealSlot; }
}
