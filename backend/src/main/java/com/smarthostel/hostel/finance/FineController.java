package com.smarthostel.hostel.finance;

import com.smarthostel.hostel.communication.EmailService;
import com.smarthostel.hostel.student.Student;
import com.smarthostel.hostel.student.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/fines")
public class FineController {

    private final FineRepository fineRepository;
    private final StudentRepository studentRepository;
    private final EmailService emailService;
    private final com.smarthostel.hostel.auth.UserRepository userRepository;
    private final com.smarthostel.hostel.communication.NotificationService notificationService;

    public FineController(FineRepository fineRepository, StudentRepository studentRepository, EmailService emailService, com.smarthostel.hostel.auth.UserRepository userRepository, com.smarthostel.hostel.communication.NotificationService notificationService) {
        this.fineRepository = fineRepository;
        this.studentRepository = studentRepository;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    private boolean isSuperAdmin(HttpServletRequest request) {
        return "SUPERADMIN".equals(request.getAttribute("userRole"));
    }

    @PostMapping
    public ResponseEntity<?> createFine(HttpServletRequest request, @Valid @RequestBody Fine fine) {
        if (!isSuperAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can impose fines.");
        }

        Optional<Student> studentOpt = studentRepository.findById(fine.getStudentId());
        if (studentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Student not found.");
        }

        Student student = studentOpt.get();
        Fine savedFine = fineRepository.save(fine);

        // Send email to parent
        if (student.getParentEmail() != null && !student.getParentEmail().isBlank()) {
            String subject = "Disciplinary Action: Fine Imposed";
            String body = "Dear " + student.getParentName() + ",\n\n" +
                          "A fine has been imposed on your ward, " + student.getName() + ".\n\n" +
                          "Amount: $" + fine.getAmount() + "\n" +
                          "Reason: " + fine.getReason() + "\n" +
                          "Date: " + fine.getIssuedAt() + "\n\n" +
                          "Please ensure the fine is paid promptly to avoid further action.\n\n" +
                          "Regards,\nHostel Administration";
            emailService.sendEmail(student.getParentEmail(), subject, body);
        }

        // Send realtime notification
        userRepository.findByStudentId(student.getId()).ifPresent(user -> {
            notificationService.sendToUser(user.getId(), "A new disciplinary fine of $" + fine.getAmount() + " has been imposed on you. Reason: " + fine.getReason());
        });

        return ResponseEntity.ok(savedFine);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentFines(HttpServletRequest request, @PathVariable Long studentId) {
        String role = (String) request.getAttribute("userRole");
        if ("STUDENT".equals(role)) {
            Long userId = (Long) request.getAttribute("userId");
            // Here you'd ideally check if the user is fetching their own fines
            // But we can simplify for now or implement strict checks
        }
        return ResponseEntity.ok(fineRepository.findByStudentId(studentId));
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<?> markPaid(HttpServletRequest request, @PathVariable Long id) {
        if (!isSuperAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Super Admin can mark fines as paid.");
        }
        Optional<Fine> fineOpt = fineRepository.findById(id);
        if (fineOpt.isPresent()) {
            Fine fine = fineOpt.get();
            fine.setStatus("PAID");
            fineRepository.save(fine);
            return ResponseEntity.ok("Fine marked as paid.");
        }
        return ResponseEntity.notFound().build();
    }
}
