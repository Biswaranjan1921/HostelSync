package com.smarthostel.hostel.service;

import com.smarthostel.hostel.entity.ParentAlert;
import com.smarthostel.hostel.entity.Student;
import com.smarthostel.hostel.repository.ParentAlertRepository;
import com.smarthostel.hostel.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ParentNotificationService {

	private final ParentAlertRepository parentAlertRepository;
	private final StudentRepository studentRepository;

	public ParentNotificationService(ParentAlertRepository parentAlertRepository, StudentRepository studentRepository) {
		this.parentAlertRepository = parentAlertRepository;
		this.studentRepository = studentRepository;
	}

	@Transactional
	public boolean sendAlert(Long studentId, String category, String message) {
		Optional<Student> studentOpt = studentRepository.findById(studentId);
		if (studentOpt.isEmpty()) {
			return false;
		}

		Student student = studentOpt.get();
		String parentContact = student.getParentPhone() != null && !student.getParentPhone().isBlank()
				? student.getParentPhone()
				: student.getParentEmail();

		if (parentContact == null || parentContact.isBlank()) {
			// Fallback placeholder if parent contact not verified yet
			parentContact = "parent-alert@hostelsync.edu";
		}

		String channel = student.getParentPhone() != null && !student.getParentPhone().isBlank() ? "SMS" : "EMAIL";

		// Format dynamic message body
		String formattedMessage = String.format(
				"[HostelSync Dispatcher] Alert Category: %s\n" +
				"Dear %s,\n" +
				"This is to notify you regarding your ward %s (assigned Room %s).\n" +
				"Details: %s\n" +
				"For support, contact Superintendent Office.",
				category,
				student.getParentName() != null ? student.getParentName() : "Parent/Guardian",
				student.getName(),
				student.getRoomId() != null ? "ID #" + student.getRoomId() : "Pending",
				message
		);

		// Output to console to simulate delivery
		System.out.println("=================================================");
		System.out.println("DISPATCHING OUTBOUND PARENT WARNING LOG");
		System.out.println("To: " + parentContact + " via " + channel);
		System.out.println("Message Body:");
		System.out.println(formattedMessage);
		System.out.println("=================================================");

		ParentAlert alert = new ParentAlert(
				studentId,
				student.getName(),
				parentContact,
				channel,
				category,
				formattedMessage
		);
		alert.setSentAt(LocalDateTime.now());
		parentAlertRepository.save(alert);
		
		return true;
	}
}
