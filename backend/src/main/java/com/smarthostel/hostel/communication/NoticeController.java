package com.smarthostel.hostel.communication;

import com.smarthostel.hostel.communication.Notice;
import com.smarthostel.hostel.communication.NoticeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

	private final NoticeService noticeService;
	private final com.smarthostel.hostel.auth.UserRepository userRepository;
	private final com.smarthostel.hostel.student.StudentRepository studentRepository;

	public NoticeController(NoticeService noticeService, com.smarthostel.hostel.auth.UserRepository userRepository, com.smarthostel.hostel.student.StudentRepository studentRepository) {
		this.noticeService = noticeService;
		this.userRepository = userRepository;
		this.studentRepository = studentRepository;
	}

	@GetMapping
	public List<Notice> list(HttpServletRequest request) {
		List<Notice> all = noticeService.findAll();
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if ("STUDENT".equals(role) && userId != null) {
			java.util.Optional<com.smarthostel.hostel.auth.User> userOpt = userRepository.findById(userId);
			if (userOpt.isPresent() && userOpt.get().getStudentId() != null) {
				java.util.Optional<com.smarthostel.hostel.student.Student> studentOpt = studentRepository.findById(userOpt.get().getStudentId());
				if (studentOpt.isPresent() && studentOpt.get().getHostelId() != null) {
					final Long studentHostelId = studentOpt.get().getHostelId();
					return all.stream()
							.filter(n -> n.getHostelId() == null || n.getHostelId() == 0 || studentHostelId.equals(n.getHostelId()))
							.collect(java.util.stream.Collectors.toList());
				}
			}
		} else if ("ADMIN".equals(role) && userId != null) {
			java.util.Optional<com.smarthostel.hostel.auth.User> userOpt = userRepository.findById(userId);
			Long adminHostelId = 1L;
			if (userOpt.isPresent() && userOpt.get().getHostelId() != null) {
				adminHostelId = userOpt.get().getHostelId();
			}
			final Long targetHostelId = adminHostelId;
			return all.stream()
					.filter(n -> n.getHostelId() == null || n.getHostelId() == 0 || targetHostelId.equals(n.getHostelId()))
					.collect(java.util.stream.Collectors.toList());
		}
		return all;
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody Notice notice) {
		String role = (String) request.getAttribute("userRole");
		String username = (String) request.getAttribute("username");
		Long userId = (Long) request.getAttribute("userId");

		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can post notices");
		}

		if ("ADMIN".equals(role) && userId != null) {
			java.util.Optional<com.smarthostel.hostel.auth.User> userOpt = userRepository.findById(userId);
			if (userOpt.isPresent() && userOpt.get().getHostelId() != null) {
				notice.setHostelId(userOpt.get().getHostelId());
			} else {
				notice.setHostelId(1L);
			}
		}

		notice.setPostedBy(username);
		Notice created = noticeService.create(notice);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(HttpServletRequest request, @PathVariable Long id) {
		String role = (String) request.getAttribute("userRole");
		if (!"ADMIN".equals(role) && !"SUPERADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can delete notices");
		}

		noticeService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
