package com.smarthostel.hostel.service;

import com.smarthostel.hostel.entity.LeaveRequest;
import com.smarthostel.hostel.repository.LeaveRequestRepository;
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
}
