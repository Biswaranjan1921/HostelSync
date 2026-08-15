package com.smarthostel.hostel.communication;

import com.smarthostel.hostel.communication.ParentAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParentAlertRepository extends JpaRepository<ParentAlert, Long> {
	List<ParentAlert> findByStudentId(Long studentId);
	List<ParentAlert> findAllByOrderBySentAtDesc();
}
