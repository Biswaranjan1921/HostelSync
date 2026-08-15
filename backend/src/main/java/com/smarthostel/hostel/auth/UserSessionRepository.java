package com.smarthostel.hostel.auth;

import com.smarthostel.hostel.auth.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface UserSessionRepository extends JpaRepository<UserSession, String> {
	void deleteByExpiryBefore(LocalDateTime now);
	void deleteByUserId(Long userId);
}
