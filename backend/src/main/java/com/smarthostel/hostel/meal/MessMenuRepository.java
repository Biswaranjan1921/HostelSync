package com.smarthostel.hostel.meal;

import com.smarthostel.hostel.meal.MessMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MessMenuRepository extends JpaRepository<MessMenu, Long> {
	Optional<MessMenu> findByDayOfWeek(String dayOfWeek);
}
