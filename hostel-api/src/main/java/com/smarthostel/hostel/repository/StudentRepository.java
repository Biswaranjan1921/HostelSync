package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
	Optional<Student> findByQrToken(String qrToken);
	List<Student> findByRoomId(Long roomId);
	List<Student> findByStatus(String status);
	boolean existsByQrToken(String qrToken);
}
