package com.smarthostel.hostel.room;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_audit_logs")
public class RoomAuditLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "room_id", nullable = false)
	private Long roomId;

	@Column(name = "room_number", nullable = false)
	private String roomNumber;

	@Column(name = "old_capacity", nullable = false)
	private Integer oldCapacity;

	@Column(name = "new_capacity", nullable = false)
	private Integer newCapacity;

	@Column(name = "changed_by", nullable = false)
	private String changedBy;

	@Column(name = "changed_at", nullable = false)
	private LocalDateTime changedAt = LocalDateTime.now();

	public RoomAuditLog() {}

	public RoomAuditLog(Long roomId, String roomNumber, Integer oldCapacity, Integer newCapacity, String changedBy) {
		this.roomId = roomId;
		this.roomNumber = roomNumber;
		this.oldCapacity = oldCapacity;
		this.newCapacity = newCapacity;
		this.changedBy = changedBy;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getRoomId() { return roomId; }
	public void setRoomId(Long roomId) { this.roomId = roomId; }
	public String getRoomNumber() { return roomNumber; }
	public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
	public Integer getOldCapacity() { return oldCapacity; }
	public void setOldCapacity(Integer oldCapacity) { this.oldCapacity = oldCapacity; }
	public Integer getNewCapacity() { return newCapacity; }
	public void setNewCapacity(Integer newCapacity) { this.newCapacity = newCapacity; }
	public String getChangedBy() { return changedBy; }
	public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
	public LocalDateTime getChangedAt() { return changedAt; }
	public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}
