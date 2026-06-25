package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.Payment;
import com.smarthostel.hostel.entity.User;
import com.smarthostel.hostel.repository.PaymentRepository;
import com.smarthostel.hostel.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

	private final PaymentRepository paymentRepository;
	private final UserRepository userRepository;

	public PaymentController(PaymentRepository paymentRepository, UserRepository userRepository) {
		this.paymentRepository = paymentRepository;
		this.userRepository = userRepository;
	}

	@GetMapping
	public ResponseEntity<?> list(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if ("STUDENT".equals(role)) {
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
				return ResponseEntity.ok(paymentRepository.findByStudentId(userOpt.get().getStudentId()));
			}
			return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
		}

		// Admins/SuperAdmins see all payments
		return ResponseEntity.ok(paymentRepository.findAll());
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody Payment payment) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}
		if (payment.getStatus() == null) {
			payment.setStatus("PENDING");
		}
		return ResponseEntity.status(HttpStatus.CREATED).body(paymentRepository.save(payment));
	}

	@PostMapping("/{id}/pay")
	public ResponseEntity<?> pay(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		Optional<Payment> paymentOpt = paymentRepository.findById(id);
		if (paymentOpt.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		Payment payment = paymentOpt.get();

		if ("STUDENT".equals(role)) {
			Optional<User> userOpt = userRepository.findById(userId);
			if (userOpt.isEmpty() || !payment.getStudentId().equals(userOpt.get().getStudentId())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cannot pay for other student fees");
			}
		}

		if ("PAID".equals(payment.getStatus())) {
			return ResponseEntity.badRequest().body("Payment has already been paid");
		}

		payment.setStatus("PAID");
		payment.setPaymentDate(LocalDate.now());
		payment.setReceiptToken("REC-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());

		return ResponseEntity.ok(paymentRepository.save(payment));
	}

	@PutMapping("/{id}/verify")
	public ResponseEntity<?> verify(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}

		Optional<Payment> paymentOpt = paymentRepository.findById(id);
		if (paymentOpt.isEmpty()) {
			return ResponseEntity.notFound().build();
		}

		Payment payment = paymentOpt.get();
		payment.setStatus("PAID");
		if (payment.getPaymentDate() == null) {
			payment.setPaymentDate(LocalDate.now());
		}
		if (payment.getReceiptToken() == null) {
			payment.setReceiptToken("REC-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
		}

		return ResponseEntity.ok(paymentRepository.save(payment));
	}
}
