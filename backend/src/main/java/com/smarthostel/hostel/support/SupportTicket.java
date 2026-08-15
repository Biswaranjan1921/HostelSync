package com.smarthostel.hostel.support;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotNull
	@Column(name = "user_id", nullable = false)
	private Long userId;

	@NotBlank
	@Column(nullable = false)
	private String username;

	@NotBlank
	@Column(name = "user_role", nullable = false)
	private String userRole;

	@NotBlank
	@Column(nullable = false)
	private String subject;

	@NotBlank
	@Column(nullable = false, length = 1000)
	private String message;

	@NotBlank
	@Column(nullable = false)
	private String status = "OPEN"; // OPEN, RESOLVED

	@Column(length = 1000)
	private String reply;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt = LocalDateTime.now();

	public SupportTicket() {}

	public SupportTicket(Long userId, String username, String userRole, String subject, String message) {
		this.userId = userId;
		this.username = username;
		this.userRole = userRole;
		this.subject = subject;
		this.message = message;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getUserId() { return userId; }
	public void setUserId(Long userId) { this.userId = userId; }
	public String getUsername() { return username; }
	public void setUsername(String username) { this.username = username; }
	public String getUserRole() { return userRole; }
	public void setUserRole(String userRole) { this.userRole = userRole; }
	public String getSubject() { return subject; }
	public void setSubject(String subject) { this.subject = subject; }
	public String getMessage() { return message; }
	public void setMessage(String message) { this.message = message; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public String getReply() { return reply; }
	public void setReply(String reply) { this.reply = reply; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
