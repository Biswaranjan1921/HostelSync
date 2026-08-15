package com.smarthostel.hostel.auth;

import com.smarthostel.hostel.core.SystemSetting;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.auth.UserSession;
import com.smarthostel.hostel.core.SystemSettingRepository;
import com.smarthostel.hostel.auth.UserRepository;
import com.smarthostel.hostel.auth.UserSessionRepository;
import com.smarthostel.hostel.auth.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.commons.codec.digest.DigestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService implements CommandLineRunner {

	private final UserRepository userRepository;
	private final UserSessionRepository sessionRepository;
	private final SystemSettingRepository systemSettingRepository;
	private final JwtUtil jwtUtil;

	@Value("${app.default-superadmin-pass:9861944502@SA}")
	private String defaultSuperAdminPass;

	@Value("${app.default-admin-pass:admin123}")
	private String defaultAdminPass;

	public AuthService(UserRepository userRepository, 
			UserSessionRepository sessionRepository,
			SystemSettingRepository systemSettingRepository,
			JwtUtil jwtUtil) {
		this.userRepository = userRepository;
		this.sessionRepository = sessionRepository;
		this.systemSettingRepository = systemSettingRepository;
		this.jwtUtil = jwtUtil;
	}

	@Override
	public void run(String... args) {
		// Seed default superadmin if not present
		if (userRepository.findByUsername("SuperAdmin").isEmpty()) {
			User superAdmin = new User();
			superAdmin.setUsername("SuperAdmin");
			superAdmin.setPassword(DigestUtils.sha256Hex(defaultSuperAdminPass));
			superAdmin.setRole("SUPERADMIN");
			superAdmin.setName("Super Administrator");
			userRepository.save(superAdmin);
		}

		// Seed default superintendent (admin) if not present
		if (userRepository.findByUsername("admin").isEmpty()) {
			User admin = new User();
			admin.setUsername("admin");
			admin.setPassword(DigestUtils.sha256Hex(defaultAdminPass));
			admin.setRole("ADMIN");
			admin.setName("Superintendent"); // Superintendent renaming
			admin.setHostelId(1L);
			userRepository.save(admin);
		}

		// Seed default canteen staff officer if not present
		if (userRepository.findByUsername("canteen").isEmpty()) {
			User canteen = new User();
			canteen.setUsername("canteen");
			canteen.setPassword(DigestUtils.sha256Hex("canteen123"));
			canteen.setRole("CANTEEN_STAFF");
			canteen.setName("Canteen Officer");
			userRepository.save(canteen);
		}

		// Seed default gate attendance mode if not present
		if (systemSettingRepository.findById("attendanceMode").isEmpty()) {
			systemSettingRepository.save(new SystemSetting("attendanceMode", "SELF_SCAN"));
		}
	}

	@Transactional
	public Optional<String> login(String username, String password) {
		Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
		if (userOpt.isPresent() && userOpt.get().getPassword().equals(DigestUtils.sha256Hex(password))) {
			User user = userOpt.get();
			
			String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
			return Optional.of(token);
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
			String rawPass = phone != null && !phone.isBlank() ? phone : "student123";
			user.setPassword(DigestUtils.sha256Hex(rawPass));
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
