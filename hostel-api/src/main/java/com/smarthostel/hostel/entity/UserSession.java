package com.smarthostel.hostel.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions")
public class UserSession {

	@Id
	private String token;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(nullable = false)
	private String username;

	@Column(nullable = false)
	private String role;

	@Column(nullable = false)
	private LocalDateTime expiry;

	public UserSession() {}

	public UserSession(String token, Long userId, String username, String role, LocalDateTime expiry) {
		this.token = token;
		this.userId = userId;
		this.username = username;
		this.role = role;
		this.expiry = expiry;
	}

	public String getToken() { return token; }
	public void setToken(String token) { this.token = token; }

	public Long getUserId() { return userId; }
	public void setUserId(Long userId) { this.userId = userId; }

	public String getUsername() { return username; }
	public void setUsername(String username) { this.username = username; }

	public String getRole() { return role; }
	public void setRole(String role) { this.role = role; }

	public LocalDateTime getExpiry() { return expiry; }
	public void setExpiry(LocalDateTime expiry) { this.expiry = expiry; }

	public boolean isExpired() {
		return LocalDateTime.now().isAfter(expiry);
	}
}
