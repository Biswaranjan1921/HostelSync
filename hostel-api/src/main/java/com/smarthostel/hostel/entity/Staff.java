package com.smarthostel.hostel.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "staffs")
public class Staff {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank
	@Column(nullable = false)
	private String name;

	@NotBlank
	@Column(nullable = false)
	private String role; // HOUSEKEEPING, SECURITY, MAINTENANCE

	@NotBlank
	@Column(nullable = false)
	private String phone;

	@NotBlank
	@Column(nullable = false)
	private String status = "ACTIVE"; // ACTIVE, INACTIVE

	public Staff() {}

	public Staff(String name, String role, String phone, String status) {
		this.name = name;
		this.role = role;
		this.phone = phone;
		this.status = status;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getRole() { return role; }
	public void setRole(String role) { this.role = role; }
	public String getPhone() { return phone; }
	public void setPhone(String phone) { this.phone = phone; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
}
