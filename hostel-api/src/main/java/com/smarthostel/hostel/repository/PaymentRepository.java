package com.smarthostel.hostel.repository;

import com.smarthostel.hostel.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
	List<Payment> findByStudentId(Long studentId);
	List<Payment> findByStatus(String status);
}
