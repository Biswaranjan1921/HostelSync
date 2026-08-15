package com.smarthostel.hostel.auth;

import com.smarthostel.hostel.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findByUsername(String username);
	Optional<User> findByUsernameIgnoreCase(String username);
	Optional<User> findByStudentId(Long studentId);
	List<User> findByRole(String role);
}
