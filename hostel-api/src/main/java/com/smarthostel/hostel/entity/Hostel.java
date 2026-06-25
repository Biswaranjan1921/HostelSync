package com.smarthostel.hostel.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "hostels")
public class Hostel {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank
	@Column(nullable = false)
	private String name;

	@NotBlank
	@Column(nullable = false, unique = true)
	private String code;

	private String address;

	@NotBlank
	@Column(nullable = false)
	private String type; // BOYS, GIRLS, COED

	@Column(name = "total_floors")
	private Integer totalFloors = 1;

	@Column(name = "rooms_per_floor")
	private Integer roomsPerFloor = 10;

	@Column(name = "default_capacity")
	private Integer defaultCapacity = 2;

	public Hostel() {}

	public Hostel(String name, String code, String address, String type) {
		this.name = name;
		this.code = code;
		this.address = address;
		this.type = type;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getCode() { return code; }
	public void setCode(String code) { this.code = code; }
	public String getAddress() { return address; }
	public void setAddress(String address) { this.address = address; }
	public String getType() { return type; }
	public void setType(String type) { this.type = type; }
	public Integer getTotalFloors() { return totalFloors; }
	public void setTotalFloors(Integer totalFloors) { this.totalFloors = totalFloors; }
	public Integer getRoomsPerFloor() { return roomsPerFloor; }
	public void setRoomsPerFloor(Integer roomsPerFloor) { this.roomsPerFloor = roomsPerFloor; }
	public Integer getDefaultCapacity() { return defaultCapacity; }
	public void setDefaultCapacity(Integer defaultCapacity) { this.defaultCapacity = defaultCapacity; }
}
