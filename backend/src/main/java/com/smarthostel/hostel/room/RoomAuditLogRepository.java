package com.smarthostel.hostel.room;

import com.smarthostel.hostel.room.RoomAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomAuditLogRepository extends JpaRepository<RoomAuditLog, Long> {
	List<RoomAuditLog> findAllByOrderByChangedAtDesc();
}
