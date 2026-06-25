package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.MessMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MessMenuRepository extends JpaRepository<MessMenu, Long> {
	Optional<MessMenu> findByDayOfWeek(String dayOfWeek);
}
