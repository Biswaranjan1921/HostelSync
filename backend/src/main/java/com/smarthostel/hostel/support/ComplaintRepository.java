package com.smarthostel.hostel.support;

import com.smarthostel.hostel.support.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
	List<Complaint> findByStudentId(Long studentId);
	List<Complaint> findByStatus(String status);
	List<Complaint> findAllByStatusAndCreatedAtBefore(String status, java.time.LocalDateTime date);
}
