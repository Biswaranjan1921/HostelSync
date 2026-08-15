package com.smarthostel.hostel.support;

import com.smarthostel.hostel.support.Complaint;
import com.smarthostel.hostel.support.ComplaintRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ComplaintService {

	private final ComplaintRepository complaintRepository;

	public ComplaintService(ComplaintRepository complaintRepository) {
		this.complaintRepository = complaintRepository;
	}

	public List<Complaint> findAll() {
		return complaintRepository.findAll();
	}

	public List<Complaint> findByStudentId(Long studentId) {
		return complaintRepository.findByStudentId(studentId);
	}

	public Optional<Complaint> findById(Long id) {
		return complaintRepository.findById(id);
	}

	@Transactional
	public Complaint create(Complaint complaint) {
		complaint.setStatus("OPEN");
		return complaintRepository.save(complaint);
	}

	@Transactional
	public Optional<Complaint> updateStatus(Long id, String status) {
		Optional<Complaint> complaintOpt = complaintRepository.findById(id);
		if (complaintOpt.isPresent()) {
			Complaint complaint = complaintOpt.get();
			complaint.setStatus(status);
			return Optional.of(complaintRepository.save(complaint));
		}
		return Optional.empty();
	}
}
