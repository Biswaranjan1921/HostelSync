package com.smarthostel.hostel.core;

import com.smarthostel.hostel.core.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StaffRepository extends JpaRepository<Staff, Long> {
	List<Staff> findByRole(String role);
	List<Staff> findByStatus(String status);
}
