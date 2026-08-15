package com.smarthostel.hostel.support;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
public class Complaint {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotNull
	@Column(name = "student_id", nullable = false)
	private Long studentId;

	@NotBlank
	@Column(name = "student_name", nullable = false)
	private String studentName;

	@NotBlank
	@Column(nullable = false)
	private String category; // PLUMBING, ELECTRICAL, WIFI, CLEANING, OTHER

	@NotBlank
	@Column(nullable = false)
	private String title;

	@NotBlank
	@Column(nullable = false, length = 1000)
	private String description;

	@Column(nullable = false)
	private String status = "OPEN"; // OPEN, RESOLVED

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt = LocalDateTime.now();

	public Complaint() {}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }

	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }

	public String getStudentName() { return studentName; }
	public void setStudentName(String studentName) { this.studentName = studentName; }

	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }

	public String getTitle() { return title; }
	public void setTitle(String title) { this.title = title; }

	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }

	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }

	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
