package com.smarthostel.hostel.attendance;

import com.smarthostel.hostel.attendance.HostelAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HostelAttendanceRepository extends JpaRepository<HostelAttendance, Long> {
	List<HostelAttendance> findByStudentId(Long studentId);
	List<HostelAttendance> findAllByOrderByTimestampDesc();
}
