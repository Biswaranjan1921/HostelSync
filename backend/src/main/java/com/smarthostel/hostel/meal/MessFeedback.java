package com.smarthostel.hostel.meal;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "mess_feedbacks")
public class MessFeedback {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotNull
	@Column(name = "student_id", nullable = false)
	private Long studentId;

	@NotBlank
	@Column(name = "student_name", nullable = false)
	private String studentName;

	@NotNull
	@Min(1)
	@Max(5)
	@Column(nullable = false)
	private Integer rating;

	@Column(length = 500)
	private String comments;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt = LocalDateTime.now();

	public MessFeedback() {}

	public MessFeedback(Long studentId, String studentName, Integer rating, String comments) {
		this.studentId = studentId;
		this.studentName = studentName;
		this.rating = rating;
		this.comments = comments;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }
	public String getStudentName() { return studentName; }
	public void setStudentName(String studentName) { this.studentName = studentName; }
	public Integer getRating() { return rating; }
	public void setRating(Integer rating) { this.rating = rating; }
	public String getComments() { return comments; }
	public void setComments(String comments) { this.comments = comments; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
