package com.smarthostel.hostel.core;

import com.smarthostel.hostel.student.StudentRepository;
import com.smarthostel.hostel.room.RoomRepository;
import com.smarthostel.hostel.meal.MealVerificationRepository;
import com.smarthostel.hostel.auth.UserRepository;
import com.smarthostel.hostel.leave.LeaveRequestRepository;
import com.smarthostel.hostel.support.ComplaintRepository;
import com.smarthostel.hostel.room.HostelRepository;
import com.smarthostel.hostel.finance.PaymentRepository;
import com.smarthostel.hostel.attendance.VisitorRepository;
import com.smarthostel.hostel.attendance.HostelAttendanceRepository;
import com.smarthostel.hostel.room.Room;
import com.smarthostel.hostel.finance.Payment;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.student.Student;
import com.smarthostel.hostel.room.Hostel;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

	private final StudentRepository studentRepository;
	private final RoomRepository roomRepository;
	private final MealVerificationRepository mealVerificationRepository;
	private final UserRepository userRepository;
	private final LeaveRequestRepository leaveRequestRepository;
	private final ComplaintRepository complaintRepository;
	private final HostelRepository hostelRepository;
	private final PaymentRepository paymentRepository;
	private final VisitorRepository visitorRepository;
	private final HostelAttendanceRepository attendanceRepository;

	public DashboardController(
			StudentRepository studentRepository,
			RoomRepository roomRepository,
			MealVerificationRepository mealVerificationRepository,
			UserRepository userRepository,
			LeaveRequestRepository leaveRequestRepository,
			ComplaintRepository complaintRepository,
			HostelRepository hostelRepository,
			PaymentRepository paymentRepository,
			VisitorRepository visitorRepository,
			HostelAttendanceRepository attendanceRepository) {
		this.studentRepository = studentRepository;
		this.roomRepository = roomRepository;
		this.mealVerificationRepository = mealVerificationRepository;
		this.userRepository = userRepository;
		this.leaveRequestRepository = leaveRequestRepository;
		this.complaintRepository = complaintRepository;
		this.hostelRepository = hostelRepository;
		this.paymentRepository = paymentRepository;
		this.visitorRepository = visitorRepository;
		this.attendanceRepository = attendanceRepository;
	}

	@GetMapping("/stats")
	public ResponseEntity<?> stats(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		}

		Long userId = (Long) request.getAttribute("userId");
		LocalDate today = LocalDate.now();

		if ("ADMIN".equals(role)) {
			// Superintendent: Scope stats strictly to allotted hostel
			Long hostelId = 1L;
			if (userId != null) {
				Optional<User> userOpt = userRepository.findById(userId);
				if (userOpt.isPresent() && userOpt.get().getHostelId() != null) {
					hostelId = userOpt.get().getHostelId();
				}
			}

			final Long targetHostelId = hostelId;
			Hostel hostelDetails = hostelRepository.findById(targetHostelId).orElse(null);

			List<Student> hostelStudents = studentRepository.findAll().stream()
					.filter(s -> targetHostelId.equals(s.getHostelId()))
					.collect(Collectors.toList());
			Set<Long> studentIds = hostelStudents.stream().map(Student::getId).collect(Collectors.toSet());

			List<Room> hostelRooms = roomRepository.findAll().stream()
					.filter(r -> targetHostelId.equals(r.getHostelId()))
					.collect(Collectors.toList());

			long openComplaints = complaintRepository.findByStatus("OPEN").stream()
					.filter(c -> studentIds.contains(c.getStudentId()))
					.count();

			long pendingLeaves = leaveRequestRepository.findByStatus("PENDING").stream()
					.filter(l -> studentIds.contains(l.getStudentId()))
					.count();

			int totalCapacity = hostelRooms.stream().mapToInt(Room::getCapacity).sum();
			int totalOccupied = hostelRooms.stream().mapToInt(Room::getCurrentOccupancy).sum();
			double occupancyPercentage = totalCapacity > 0 ? ((double) totalOccupied / totalCapacity) * 100 : 0.0;

			Map<String, Object> adminStats = new HashMap<>();
			adminStats.put("totalStudents", hostelStudents.size());
			adminStats.put("totalRooms", hostelRooms.size());
			adminStats.put("openComplaints", openComplaints);
			adminStats.put("pendingLeaves", pendingLeaves);
			adminStats.put("occupancyPercentage", Math.round(occupancyPercentage * 100.0) / 100.0);
			adminStats.put("allottedHostel", hostelDetails != null ? hostelDetails : Map.of("name", "Hostel #" + targetHostelId));

			return ResponseEntity.ok(adminStats);
		}

		// SUPERADMIN: System-wide stats
		long students = studentRepository.count();
		long rooms = roomRepository.count();
		long mealsToday = mealVerificationRepository.countByVerificationDate(today);
		long openComplaints = complaintRepository.findByStatus("OPEN").size();
		long pendingLeaves = leaveRequestRepository.findByStatus("PENDING").size();

		long hostels = hostelRepository.count();
		long visitorsPending = visitorRepository.findByStatus("PENDING").size();
		long attendanceToday = attendanceRepository.findAll().stream()
				.filter(a -> a.getTimestamp().toLocalDate().equals(today))
				.count();

		List<Room> allRooms = roomRepository.findAll();
		int totalCapacity = allRooms.stream().mapToInt(Room::getCapacity).sum();
		int totalOccupied = allRooms.stream().mapToInt(Room::getCurrentOccupancy).sum();
		double occupancyPercentage = totalCapacity > 0 ? ((double) totalOccupied / totalCapacity) * 100 : 0.0;

		double totalRevenue = paymentRepository.findByStatus("PAID").stream()
				.mapToDouble(Payment::getAmount)
				.sum();

		return ResponseEntity.ok(Map.of(
				"totalStudents", students,
				"totalRooms", rooms,
				"mealsVerifiedToday", mealsToday,
				"openComplaints", openComplaints,
				"pendingLeaves", pendingLeaves,
				"totalHostels", hostels,
				"visitorsPending", visitorsPending,
				"attendanceToday", attendanceToday,
				"occupancyPercentage", Math.round(occupancyPercentage * 100.0) / 100.0,
				"totalRevenue", totalRevenue
		));
	}

	@GetMapping("/student-stats")
	public ResponseEntity<?> studentStats(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if (!"STUDENT".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only students can fetch student stats");
		}

		Optional<User> userOpt = userRepository.findById(userId);
		if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
			Long studentId = userOpt.get().getStudentId();
			Optional<Student> studentDetails = studentRepository.findById(studentId);
			
			long personalMeals = mealVerificationRepository.findByStudentId(studentId).size();
			long activeComplaints = complaintRepository.findByStudentId(studentId).stream()
					.filter(c -> "OPEN".equals(c.getStatus())).count();
			long pendingLeaves = leaveRequestRepository.findByStudentId(studentId).stream()
					.filter(l -> "PENDING".equals(l.getStatus())).count();

			// Roommate details
			List<Student> roommates = new ArrayList<>();
			Room roomDetails = null;
			Hostel hostelDetails = null;
			if (studentDetails.isPresent()) {
				Long roomId = studentDetails.get().getRoomId();
				if (roomId != null) {
					roommates = studentRepository.findByRoomId(roomId).stream()
							.filter(s -> !s.getId().equals(studentId))
							.collect(Collectors.toList());
					roomDetails = roomRepository.findById(roomId).orElse(null);
					if (roomDetails != null && roomDetails.getHostelId() != null) {
						hostelDetails = hostelRepository.findById(roomDetails.getHostelId()).orElse(null);
					}
				}
			}

			// Payment fee status
			List<Payment> studentPayments = paymentRepository.findByStudentId(studentId);
			double pendingFeesAmount = studentPayments.stream()
					.filter(p -> "PENDING".equals(p.getStatus()))
					.mapToDouble(Payment::getAmount)
					.sum();
			String feeStatus = pendingFeesAmount > 0 ? "DUE" : (studentPayments.isEmpty() ? "NO_INVOICE" : "PAID");

			// Attendance percentage (mock or calculated from attendance logs)
			long gateLogs = attendanceRepository.findByStudentId(studentId).size();
			double attendancePercent = gateLogs > 0 ? Math.min(100.0, 75.0 + (gateLogs * 2.5)) : 95.0; // simple simulation

			return ResponseEntity.ok(Map.of(
					"personalMealsCount", personalMeals,
					"activeComplaintsCount", activeComplaints,
					"pendingLeavesCount", pendingLeaves,
					"roommates", roommates,
					"roomDetails", roomDetails != null ? roomDetails : Map.of(),
					"hostelDetails", hostelDetails != null ? hostelDetails : Map.of(),
					"feeStatus", feeStatus,
					"pendingFeesAmount", pendingFeesAmount,
					"attendancePercentage", Math.round(attendancePercent * 10.0) / 10.0
			));
		}

		return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
	}

	@GetMapping("/ai-analytics")
	public ResponseEntity<?> aiAnalytics(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can access AI analytics");
		}

		// Mock predictions based on realistic heuristics
		Map<String, Object> roomDemand = Map.of(
				"labels", List.of("Next Month", "In 3 Months", "In 6 Months", "Next Semester"),
				"predictedDemandOccupancy", List.of(88, 92, 95, 99),
				"currentOccupancy", 82
		);

		// Calculate real defaulters based on pending payments
		List<Payment> allPendingPayments = paymentRepository.findByStatus("PENDING");
		Map<Long, Double> pendingAmounts = new HashMap<>();
		Map<Long, String> studentNames = new HashMap<>();
		
		for (Payment p : allPendingPayments) {
			pendingAmounts.put(p.getStudentId(), pendingAmounts.getOrDefault(p.getStudentId(), 0.0) + p.getAmount());
			studentNames.put(p.getStudentId(), p.getStudentName());
		}

		List<Map<String, Object>> riskDefaulters = pendingAmounts.entrySet().stream()
				.sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue())) // Sort descending by amount
				.limit(3)
				.map(e -> {
					Long stId = e.getKey();
					Double amount = e.getValue();
					int riskScore = Math.min(100, (int) (amount / 10.0)); // Simple heuristic: $1000 pending = 100% risk
					String reason = "Pending fees: $" + String.format("%.2f", amount);
					Map<String, Object> map = new HashMap<>();
					map.put("studentId", stId);
					map.put("name", studentNames.get(stId));
					map.put("riskScore", riskScore);
					map.put("reason", reason);
					return map;
				})
				.collect(Collectors.toList());

		if (riskDefaulters.isEmpty()) {
			Map<String, Object> mockDefaulter = new HashMap<>();
			mockDefaulter.put("studentId", 101L);
			mockDefaulter.put("name", "John Doe (Mock)");
			mockDefaulter.put("riskScore", 15);
			mockDefaulter.put("reason", "Minor delay in past");
			riskDefaulters = List.of(mockDefaulter);
		}

		Map<String, Object> complaintTrends = Map.of(
				"months", List.of("Jan", "Feb", "Mar", "Apr", "May", "Jun"),
				"categories", Map.of(
						"WIFI", List.of(15, 20, 25, 12, 10, 8),
						"PLUMBING", List.of(10, 8, 12, 14, 22, 18),
						"ELECTRICAL", List.of(8, 12, 15, 20, 15, 14)
				)
		);

		Map<String, Object> responseData = new HashMap<>();
		responseData.put("roomDemand", roomDemand);
		responseData.put("defaultersRisk", riskDefaulters);
		responseData.put("complaintTrends", complaintTrends);

		return ResponseEntity.ok(responseData);
	}
}
