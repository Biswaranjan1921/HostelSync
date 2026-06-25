package com.smarthostel.hostel.service;

import com.smarthostel.hostel.entity.SystemSetting;
import com.smarthostel.hostel.entity.User;
import com.smarthostel.hostel.entity.UserSession;
import com.smarthostel.hostel.repository.SystemSettingRepository;
import com.smarthostel.hostel.repository.UserRepository;
import com.smarthostel.hostel.repository.UserSessionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService implements CommandLineRunner {

	private final UserRepository userRepository;
	private final UserSessionRepository sessionRepository;
	private final SystemSettingRepository systemSettingRepository;

	public AuthService(UserRepository userRepository, 
			UserSessionRepository sessionRepository,
			SystemSettingRepository systemSettingRepository) {
		this.userRepository = userRepository;
		this.sessionRepository = sessionRepository;
		this.systemSettingRepository = systemSettingRepository;
	}

	@Override
	public void run(String... args) {
		// Seed default superadmin if not present
		if (userRepository.findByUsername("superadmin").isEmpty()) {
			User superAdmin = new User();
			superAdmin.setUsername("superadmin");
			superAdmin.setPassword("superadmin"); // In a real app we'd use BCrypt, but this is a local H2 prototype
			superAdmin.setRole("SUPERADMIN");
			superAdmin.setName("Super Administrator");
			userRepository.save(superAdmin);
		}

		// Seed default superintendent (admin) if not present
		if (userRepository.findByUsername("admin").isEmpty()) {
			User admin = new User();
			admin.setUsername("admin");
			admin.setPassword("admin");
			admin.setRole("ADMIN");
			admin.setName("Superintendent"); // Superintendent renaming
			userRepository.save(admin);
		}

		// Seed default gate attendance mode if not present
		if (systemSettingRepository.findById("attendanceMode").isEmpty()) {
			systemSettingRepository.save(new SystemSetting("attendanceMode", "SELF_SCAN"));
		}
	}

	@Transactional
	public Optional<UserSession> login(String username, String password) {
		Optional<User> userOpt = userRepository.findByUsername(username);
		if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
			User user = userOpt.get();
			
			// Clear existing sessions for this user
			sessionRepository.deleteByUserId(user.getId());

			// Create new session token
			String token = UUID.randomUUID().toString().replace("-", "");
			UserSession session = new UserSession(
					token,
					user.getId(),
					user.getUsername(),
					user.getRole(),
					LocalDateTime.now().plusDays(1) // 24 hours expiry
			);
			return Optional.of(sessionRepository.save(session));
		}
		return Optional.empty();
	}

	@Transactional
	public void logout(String token) {
		sessionRepository.deleteById(token);
	}

	@Transactional(readOnly = true)
	public Optional<UserSession> validateSession(String token) {
		Optional<UserSession> sessionOpt = sessionRepository.findById(token);
		if (sessionOpt.isPresent()) {
			UserSession session = sessionOpt.get();
			if (!session.isExpired()) {
				return Optional.of(session);
			} else {
				// Clean up expired session
				sessionRepository.delete(session);
			}
		}
		return Optional.empty();
	}

	@Transactional
	public User createOrUpdateStudentUser(Long studentId, String email, String phone, String name) {
		Optional<User> existingUserOpt = userRepository.findByStudentId(studentId);
		User user = existingUserOpt.orElseGet(User::new);
		
		user.setUsername(email);
		// Default password is set to their phone number, or "student123" if phone is blank
		if (user.getPassword() == null || user.getPassword().isBlank()) {
			user.setPassword(phone != null && !phone.isBlank() ? phone : "student123");
		}
		user.setRole("STUDENT");
		user.setName(name);
		user.setStudentId(studentId);
		
		return userRepository.save(user);
	}

	@Transactional
	public void deleteStudentUser(Long studentId) {
		Optional<User> userOpt = userRepository.findByStudentId(studentId);
		if (userOpt.isPresent()) {
			User user = userOpt.get();
			sessionRepository.deleteByUserId(user.getId());
			userRepository.delete(user);
		}
	}
}
