package com.smarthostel.hostel.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitors")
public class Visitor {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank
	@Column(name = "visitor_name", nullable = false)
	private String visitorName;

	@NotBlank
	@Column(nullable = false)
	private String relation; // PARENT, SIBLING, FRIEND, OTHER

	@NotNull
	@Column(name = "student_id", nullable = false)
	private Long studentId;

	@NotBlank
	@Column(name = "student_name", nullable = false)
	private String studentName;

	@Column(name = "entry_time")
	private LocalDateTime entryTime;

	@Column(name = "exit_time")
	private LocalDateTime exitTime;

	@NotBlank
	@Column(nullable = false)
	private String status = "PENDING"; // PENDING, APPROVED, COMPLETED

	public Visitor() {}

	public Visitor(String visitorName, String relation, Long studentId, String studentName) {
		this.visitorName = visitorName;
		this.relation = relation;
		this.studentId = studentId;
		this.studentName = studentName;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getVisitorName() { return visitorName; }
	public void setVisitorName(String visitorName) { this.visitorName = visitorName; }
	public String getRelation() { return relation; }
	public void setRelation(String relation) { this.relation = relation; }
	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }
	public String getStudentName() { return studentName; }
	public void setStudentName(String studentName) { this.studentName = studentName; }
	public LocalDateTime getEntryTime() { return entryTime; }
	public void setEntryTime(LocalDateTime entryTime) { this.entryTime = entryTime; }
	public LocalDateTime getExitTime() { return exitTime; }
	public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
}
