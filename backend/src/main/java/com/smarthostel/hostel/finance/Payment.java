package com.smarthostel.hostel.finance;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
public class Payment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotNull
	@Column(name = "student_id", nullable = false)
	private Long studentId;

	@NotBlank
	@Column(name = "student_name", nullable = false)
	private String studentName;

	@NotNull
	@Column(nullable = false)
	private Double amount;

	@Column(name = "due_date")
	private LocalDate dueDate;

	@Column(name = "payment_date")
	private LocalDate paymentDate;

	@NotBlank
	@Column(nullable = false)
	private String status = "PENDING"; // PENDING, PAID

	@Column(name = "receipt_token")
	private String receiptToken;

	public Payment() {}

	public Payment(Long studentId, String studentName, Double amount, LocalDate dueDate, String status) {
		this.studentId = studentId;
		this.studentName = studentName;
		this.amount = amount;
		this.dueDate = dueDate;
		this.status = status;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getStudentId() { return studentId; }
	public void setStudentId(Long studentId) { this.studentId = studentId; }
	public String getStudentName() { return studentName; }
	public void setStudentName(String studentName) { this.studentName = studentName; }
	public Double getAmount() { return amount; }
	public void setAmount(Double amount) { this.amount = amount; }
	public LocalDate getDueDate() { return dueDate; }
	public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
	public LocalDate getPaymentDate() { return paymentDate; }
	public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public String getReceiptToken() { return receiptToken; }
	public void setReceiptToken(String receiptToken) { this.receiptToken = receiptToken; }
}
