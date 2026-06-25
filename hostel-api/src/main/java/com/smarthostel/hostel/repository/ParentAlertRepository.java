package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.ParentAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParentAlertRepository extends JpaRepository<ParentAlert, Long> {
	List<ParentAlert> findByStudentId(Long studentId);
	List<ParentAlert> findAllByOrderBySentAtDesc();
}
