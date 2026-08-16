package com.smarthostel.hostel.leave;

import com.smarthostel.hostel.leave.LeaveRequest;
import com.smarthostel.hostel.leave.LeaveRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class LeaveRequestService {

	private final LeaveRequestRepository leaveRequestRepository;

	public LeaveRequestService(LeaveRequestRepository leaveRequestRepository) {
		this.leaveRequestRepository = leaveRequestRepository;
	}

	public List<LeaveRequest> findAll() {
		return leaveRequestRepository.findAll();
	}

	public List<LeaveRequest> findByStudentId(Long studentId) {
		return leaveRequestRepository.findByStudentId(studentId);
	}

	public Optional<LeaveRequest> findById(Long id) {
		return leaveRequestRepository.findById(id);
	}

	@Transactional
	public LeaveRequest create(LeaveRequest request) {
		request.setStatus("PENDING");
		return leaveRequestRepository.save(request);
	}

	@Transactional
	public Optional<LeaveRequest> updateStatus(Long id, String status) {
		Optional<LeaveRequest> requestOpt = leaveRequestRepository.findById(id);
		if (requestOpt.isPresent()) {
			LeaveRequest request = requestOpt.get();
			request.setStatus(status);
			return Optional.of(leaveRequestRepository.save(request));
		}
		return Optional.empty();
	}

	public java.util.Map<String, Object> verifyGatePass(String qrPayload, com.smarthostel.hostel.student.StudentRepository studentRepository, com.smarthostel.hostel.room.RoomRepository roomRepository) {
		java.util.Map<String, Object> res = new java.util.HashMap<>();
		if (qrPayload == null || qrPayload.trim().isEmpty()) {
			res.put("success", false);
			res.put("message", "FORMAL DENIAL NOTICE: Invalid or empty QR payload scanned.");
			return res;
		}

		String clean = qrPayload.trim();
		Long leaveId = null;
		if (clean.startsWith("GATEPASS-")) {
			String[] parts = clean.split("-");
			if (parts.length >= 2) {
				try {
					leaveId = Long.parseLong(parts[1]);
				} catch (Exception ignored) {}
			}
		} else {
			try {
				leaveId = Long.parseLong(clean);
			} catch (Exception ignored) {}
		}

		if (leaveId == null) {
			res.put("success", false);
			res.put("message", "FORMAL DENIAL NOTICE: Unrecognized Gate Pass QR format.");
			return res;
		}

		Optional<LeaveRequest> leaveOpt = leaveRequestRepository.findById(leaveId);
		if (leaveOpt.isEmpty()) {
			res.put("success", false);
			res.put("message", "FORMAL DENIAL NOTICE: No leave request record found for Gate Pass ID #" + leaveId + ".");
			return res;
		}

		LeaveRequest leave = leaveOpt.get();
		if (!"APPROVED".equalsIgnoreCase(leave.getStatus())) {
			res.put("success", false);
			res.put("isFormalDenial", true);
			res.put("message", "FORMAL DENIAL NOTICE: Leave Pass #" + leaveId + " status is " + leave.getStatus() + ". Approval by Hostel Superintendent is mandatory for gate clearance.");
			return res;
		}

		java.time.LocalDate today = java.time.LocalDate.now();
		if (today.isBefore(leave.getStartDate()) || today.isAfter(leave.getEndDate())) {
			res.put("success", false);
			res.put("isFormalDenial", true);
			res.put("message", "FORMAL DENIAL NOTICE: Gate Pass #" + leaveId + " has expired or is not active today (Pass validity: " + leave.getStartDate() + " to " + leave.getEndDate() + ", Today: " + today + "). Gate clearance denied.");
			return res;
		}

		res.put("success", true);
		res.put("message", "GATE MOVEMENT GRANTED - APPROVED BY HOSTEL SUPERINTENDENT");
		res.put("leaveId", leave.getId());
		res.put("studentId", leave.getStudentId());
		res.put("studentName", leave.getStudentName());
		res.put("reason", leave.getReason());
		res.put("startDate", leave.getStartDate());
		res.put("endDate", leave.getEndDate());
		res.put("status", leave.getStatus());

		studentRepository.findById(leave.getStudentId()).ifPresent(s -> {
			res.put("department", s.getDepartment());
			res.put("phone", s.getPhone());
			if (s.getPhotoBase64() != null) {
				res.put("photoBase64", s.getPhotoBase64());
			}
			if (s.getRoomId() != null) {
				roomRepository.findById(s.getRoomId()).ifPresent(r -> {
					res.put("roomNumber", r.getNumber());
				});
			}
		});

		return res;
	}
}
