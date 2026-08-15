package com.smarthostel.hostel.student;

import com.smarthostel.hostel.student.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
	Optional<Student> findByQrToken(String qrToken);
	List<Student> findByRoomId(Long roomId);
	List<Student> findByStatus(String status);
	Optional<Student> findByEmail(String email);
	boolean existsByQrToken(String qrToken);
}
