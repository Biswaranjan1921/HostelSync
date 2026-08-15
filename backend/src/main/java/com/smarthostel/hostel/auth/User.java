package com.smarthostel.hostel.auth;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank
	@Column(unique = true, nullable = false)
	private String username;

	@NotBlank
	@Column(nullable = false)
	private String password;

	@NotBlank
	@Column(nullable = false)
	private String role; // "STUDENT", "ADMIN", "SUPERADMIN"

	@NotBlank
	@Column(nullable = false)
	private String name;

	@Column(name = "student_id")
	private Long studentId; // Links to Student entity if the user is a student

	@Column(name = "hostel_id")
	private Long hostelId; // Links to Hostel entity if the user is an Admin/Superintendent

	@Column(name = "otp")
	private String otp;

	@Column(name = "otp_expiry")
	private java.time.LocalDateTime otpExpiry;

	public User() {}

	public User(String username, String password, String role, String name) {
		this.username = username;
		this.password = password;
		this.role = role;
		this.name = name;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }

	public String getUsername() { return username; }
	public void setUsername(String username) { this.username = username; }

	public String getPassword() { return password; }
	public void setPassword(String password) { this.password = password; }

	public String getRole() { return role; }
	public void setRole(String role) { this.role = role; }

	public String getName() { return name; }
	public void setName(String name) { this.name = name; }

	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }

	public Long getHostelId() { return hostelId; }
	public void setHostelId(Long hostelId) { this.hostelId = hostelId; }

	public String getOtp() { return otp; }
	public void setOtp(String otp) { this.otp = otp; }

	public java.time.LocalDateTime getOtpExpiry() { return otpExpiry; }
	public void setOtpExpiry(java.time.LocalDateTime otpExpiry) { this.otpExpiry = otpExpiry; }
}
