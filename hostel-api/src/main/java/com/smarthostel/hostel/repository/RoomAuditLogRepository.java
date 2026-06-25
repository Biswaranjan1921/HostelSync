package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.RoomAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomAuditLogRepository extends JpaRepository<RoomAuditLog, Long> {
	List<RoomAuditLog> findAllByOrderByChangedAtDesc();
}
