package com.smarthostel.hostel.attendance;

import com.smarthostel.hostel.attendance.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {
	List<Visitor> findByStudentId(Long studentId);
	List<Visitor> findByStatus(String status);
}
