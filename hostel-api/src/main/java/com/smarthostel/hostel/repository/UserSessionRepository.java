package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface UserSessionRepository extends JpaRepository<UserSession, String> {
	void deleteByExpiryBefore(LocalDateTime now);
	void deleteByUserId(Long userId);
}
