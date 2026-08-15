package com.smarthostel.hostel.finance;

import com.smarthostel.hostel.finance.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
	List<Payment> findByStudentId(Long studentId);
	List<Payment> findByStatus(String status);
}
