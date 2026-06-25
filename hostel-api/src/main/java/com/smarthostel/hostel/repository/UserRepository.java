package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findByUsername(String username);
	Optional<User> findByStudentId(Long studentId);
	List<User> findByRole(String role);
}
