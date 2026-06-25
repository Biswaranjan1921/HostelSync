package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.HostelAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HostelAttendanceRepository extends JpaRepository<HostelAttendance, Long> {
	List<HostelAttendance> findByStudentId(Long studentId);
	List<HostelAttendance> findAllByOrderByTimestampDesc();
}
