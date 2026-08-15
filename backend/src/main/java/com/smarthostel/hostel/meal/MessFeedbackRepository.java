package com.smarthostel.hostel.meal;

import com.smarthostel.hostel.meal.MessFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessFeedbackRepository extends JpaRepository<MessFeedback, Long> {
	List<MessFeedback> findAllByOrderByCreatedAtDesc();
}
