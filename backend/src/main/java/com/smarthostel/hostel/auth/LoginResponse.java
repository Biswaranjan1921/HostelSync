package com.smarthostel.hostel.auth;

public class LoginResponse {

	private String token;
	private String username;
	private String role;
	private String name;
	private Long studentId;
	private Long hostelId;

	public LoginResponse(String token, String username, String role, String name, Long studentId, Long hostelId) {
		this.token = token;
		this.username = username;
		this.role = role;
		this.name = name;
		this.studentId = studentId;
		this.hostelId = hostelId;
	}

	public String getToken() { return token; }
	public void setToken(String token) { this.token = token; }

	public String getUsername() { return username; }
	public void setUsername(String username) { this.username = username; }

	public String getRole() { return role; }
	public void setRole(String role) { this.role = role; }

	public String getName() { return name; }
	public void setName(String name) { this.name = name; }

	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }

	public Long getHostelId() { return hostelId; }
	public void setHostelId(Long hostelId) { this.hostelId = hostelId; }
}
