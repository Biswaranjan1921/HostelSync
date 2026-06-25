package com.smarthostel.hostel.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "mess_menus")
public class MessMenu {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank
	@Column(name = "day_of_week", unique = true, nullable = false)
	private String dayOfWeek; // MONDAY, TUESDAY, etc.

	@NotBlank
	@Column(nullable = false)
	private String breakfast;

	@NotBlank
	@Column(nullable = false)
	private String lunch;

	@NotBlank
	@Column(nullable = false)
	private String dinner;

	public MessMenu() {}

	public MessMenu(String dayOfWeek, String breakfast, String lunch, String dinner) {
		this.dayOfWeek = dayOfWeek;
		this.breakfast = breakfast;
		this.lunch = lunch;
		this.dinner = dinner;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getDayOfWeek() { return dayOfWeek; }
	public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
	public String getBreakfast() { return breakfast; }
	public void setBreakfast(String breakfast) { this.breakfast = breakfast; }
	public String getLunch() { return lunch; }
	public void setLunch(String lunch) { this.lunch = lunch; }
	public String getDinner() { return dinner; }
	public void setDinner(String dinner) { this.dinner = dinner; }
}
