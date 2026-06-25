package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
	List<Complaint> findByStudentId(Long studentId);
	List<Complaint> findByStatus(String status);
}
