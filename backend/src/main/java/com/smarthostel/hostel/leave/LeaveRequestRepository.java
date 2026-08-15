package com.smarthostel.hostel.leave;

import com.smarthostel.hostel.leave.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
	List<LeaveRequest> findByStudentId(Long studentId);
	List<LeaveRequest> findByStatus(String status);
	
	@org.springframework.data.jpa.repository.Query("SELECT COUNT(l) FROM LeaveRequest l WHERE l.studentId = :studentId AND l.status = 'APPROVED' AND l.startDate <= :date AND l.endDate >= :date")
	long countActiveLeaves(@org.springframework.data.repository.query.Param("studentId") Long studentId, @org.springframework.data.repository.query.Param("date") java.time.LocalDate date);
}
