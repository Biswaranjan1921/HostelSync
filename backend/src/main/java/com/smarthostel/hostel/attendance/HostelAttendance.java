package com.smarthostel.hostel.attendance;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "hostel_attendances")
public class HostelAttendance {

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
	private String direction; // ENTRY, EXIT

	@NotNull
	@Column(nullable = false)
	private LocalDateTime timestamp = LocalDateTime.now();

	@NotBlank
	@Column(nullable = false)
	private String method = "QR_SCAN"; // QR_SCAN, MANUAL

	public HostelAttendance() {}

	public HostelAttendance(Long studentId, String studentName, String direction, String method) {
		this.studentId = studentId;
		this.studentName = studentName;
		this.direction = direction;
		this.method = method;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }
	public String getStudentName() { return studentName; }
	public void setStudentName(String studentName) { this.studentName = studentName; }
	public String getDirection() { return direction; }
	public void setDirection(String direction) { this.direction = direction; }
	public LocalDateTime getTimestamp() { return timestamp; }
	public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
	public String getMethod() { return method; }
	public void setMethod(String method) { this.method = method; }
}
