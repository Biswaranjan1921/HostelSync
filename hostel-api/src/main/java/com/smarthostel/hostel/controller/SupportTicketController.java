package com.smarthostel.hostel.controller;

import com.smarthostel.hostel.entity.SupportTicket;
import com.smarthostel.hostel.repository.SupportTicketRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/support-tickets")
public class SupportTicketController {

	private final SupportTicketRepository supportTicketRepository;

	public SupportTicketController(SupportTicketRepository supportTicketRepository) {
		this.supportTicketRepository = supportTicketRepository;
	}

	@GetMapping
	public ResponseEntity<?> list(HttpServletRequest request) {
		String role = (String) request.getAttribute("userRole");
		Long userId = (Long) request.getAttribute("userId");

		if ("SUPERADMIN".equals(role) || "ADMIN".equals(role)) {
			return ResponseEntity.ok(supportTicketRepository.findAllByOrderByCreatedAtDesc());
		} else {
			return ResponseEntity.ok(supportTicketRepository.findByUserId(userId));
		}
	}

	@PostMapping
	public ResponseEntity<?> create(HttpServletRequest request, @Valid @RequestBody SupportTicket ticket) {
		Long userId = (Long) request.getAttribute("userId");
		String username = (String) request.getAttribute("username");
		String role = (String) request.getAttribute("userRole");

		ticket.setUserId(userId);
		ticket.setUsername(username != null ? username : "unknown");
		ticket.setUserRole(role != null ? role : "STUDENT");
		ticket.setStatus("OPEN");
		ticket.setCreatedAt(LocalDateTime.now());

		return ResponseEntity.status(HttpStatus.CREATED).body(supportTicketRepository.save(ticket));
	}

	@PutMapping("/{id}/reply")
	public ResponseEntity<?> reply(HttpServletRequest request, @PathVariable Long id, @RequestBody Map<String, String> body) {
		String role = (String) request.getAttribute("userRole");
		if (!"SUPERADMIN".equals(role) && !"ADMIN".equals(role)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin or Superintendent can reply to tickets");
		}

		String replyText = body.get("reply");
		if (replyText == null || replyText.isBlank()) {
			return ResponseEntity.badRequest().body("Reply content cannot be blank");
		}

		return supportTicketRepository.findById(id).map(ticket -> {
			ticket.setReply(replyText);
			ticket.setStatus("RESOLVED");
			return ResponseEntity.ok(supportTicketRepository.save(ticket));
		}).orElse(ResponseEntity.notFound().build());
	}
}
