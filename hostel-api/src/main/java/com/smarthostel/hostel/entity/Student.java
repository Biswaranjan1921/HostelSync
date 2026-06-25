package com.smarthostel.hostel.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

@Entity
@Table(name = "students")
public class Student {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank
	@Column(nullable = false)
	private String name;

	@Email
	private String email;

	private String phone;

	@Column(name = "room_id")
	private Long roomId;

	private String department;

	@Column(name = "study_year")
	private Integer year;

	@Lob
	@Column(name = "photo_base64", columnDefinition = "TEXT")
	private String photoBase64;

	@Column(name = "qr_token", unique = true, nullable = false)
	private String qrToken;

	@Column(name = "status", nullable = false)
	private String status = "PENDING_ADMIN"; // PENDING_ADMIN, PENDING_SUPERADMIN, PENDING_PROFILE_SETUP, PENDING_PROFILE_VERIFICATION, ACTIVE, REJECTED

	@Column(name = "parent_name")
	private String parentName;

	@Column(name = "parent_phone")
	private String parentPhone;

	@Column(name = "parent_email")
	private String parentEmail;

	public Student() {
		this.qrToken = "ST-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }
	public String getPhone() { return phone; }
	public void setPhone(String phone) { this.phone = phone; }
	public Long getRoomId() { return roomId; }
	public void setRoomId(Long roomId) { this.roomId = roomId; }
	public String getDepartment() { return department; }
	public void setDepartment(String department) { this.department = department; }
	public Integer getYear() { return year; }
	public void setYear(Integer year) { this.year = year; }
	public String getPhotoBase64() { return photoBase64; }
	public void setPhotoBase64(String photoBase64) { this.photoBase64 = photoBase64; }
	public String getQrToken() { return qrToken; }
	public void setQrToken(String qrToken) { this.qrToken = qrToken; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public String getParentName() { return parentName; }
	public void setParentName(String parentName) { this.parentName = parentName; }
	public String getParentPhone() { return parentPhone; }
	public void setParentPhone(String parentPhone) { this.parentPhone = parentPhone; }
	public String getParentEmail() { return parentEmail; }
	public void setParentEmail(String parentEmail) { this.parentEmail = parentEmail; }
	public boolean isActive() { return "ACTIVE".equalsIgnoreCase(this.status); }
	public void setActive(boolean active) { this.status = active ? "ACTIVE" : "INACTIVE"; }

	public String getDailyQrToken() {
		return this.qrToken + "-" + java.time.LocalDate.now().toString().replace("-", "");
	}
}
