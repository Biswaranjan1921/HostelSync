package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.MessFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessFeedbackRepository extends JpaRepository<MessFeedback, Long> {
	List<MessFeedback> findAllByOrderByCreatedAtDesc();
}
