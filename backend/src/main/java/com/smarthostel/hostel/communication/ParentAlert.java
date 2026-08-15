package com.smarthostel.hostel.communication;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "parent_alerts")
public class ParentAlert {

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
	@Column(name = "parent_contact", nullable = false)
	private String parentContact;

	@NotBlank
	@Column(nullable = false)
	private String channel; // SMS, EMAIL

	@NotBlank
	@Column(nullable = false)
	private String category; // ATTENDANCE_SHORTAGE, DISCIPLINARY, PAYMENT_DUE

	@NotBlank
	@Column(nullable = false, length = 1000)
	private String message;

	@Column(name = "sent_at", nullable = false)
	private LocalDateTime sentAt = LocalDateTime.now();

	public ParentAlert() {}

	public ParentAlert(Long studentId, String studentName, String parentContact, String channel, String category, String message) {
		this.studentId = studentId;
		this.studentName = studentName;
		this.parentContact = parentContact;
		this.channel = channel;
		this.category = category;
		this.message = message;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }
	public String getStudentName() { return studentName; }
	public void setStudentName(String studentName) { this.studentName = studentName; }
	public String getParentContact() { return parentContact; }
	public void setParentContact(String parentContact) { this.parentContact = parentContact; }
	public String getChannel() { return channel; }
	public void setChannel(String channel) { this.channel = channel; }
	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }
	public String getMessage() { return message; }
	public void setMessage(String message) { this.message = message; }
	public LocalDateTime getSentAt() { return sentAt; }
	public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
