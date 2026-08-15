package com.smarthostel.hostel.room;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "rooms")
public class Room {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank
	@Column(nullable = false)
	private String block;

	@NotBlank
	@Column(nullable = false)
	private String number;

	@NotNull
	@Min(1)
	@Column(nullable = false)
	private Integer capacity;

	@Column(name = "current_occupancy")
	private Integer currentOccupancy = 0;

	private String floor;

	@Column(name = "hostel_id")
	private Long hostelId;

	@Column(name = "status")
	private String status = "AVAILABLE"; // AVAILABLE, FULL, MAINTENANCE

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getBlock() { return block; }
	public void setBlock(String block) { this.block = block; }
	public String getNumber() { return number; }
	public void setNumber(String number) { this.number = number; }
	public Integer getCapacity() { return capacity; }
	public void setCapacity(Integer capacity) { this.capacity = capacity; }
	public Integer getCurrentOccupancy() { return currentOccupancy; }
	public void setCurrentOccupancy(Integer currentOccupancy) { this.currentOccupancy = currentOccupancy; }
	public String getFloor() { return floor; }
	public void setFloor(String floor) { this.floor = floor; }
	public Long getHostelId() { return hostelId; }
	public void setHostelId(Long hostelId) { this.hostelId = hostelId; }
	public String getStatus() { return status == null ? "AVAILABLE" : status; }
	public void setStatus(String status) { this.status = status; }
}
