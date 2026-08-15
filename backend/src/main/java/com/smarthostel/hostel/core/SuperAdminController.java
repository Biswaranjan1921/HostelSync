package com.smarthostel.hostel.core;

import com.smarthostel.hostel.auth.StaffApplication;
import com.smarthostel.hostel.auth.StaffApplicationRepository;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.auth.UserRepository;
import com.smarthostel.hostel.communication.EmailService;
import com.smarthostel.hostel.student.Student;
import com.smarthostel.hostel.student.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminController {

    private final StaffApplicationRepository staffApplicationRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public SuperAdminController(StaffApplicationRepository staffApplicationRepository,
                                StudentRepository studentRepository,
                                UserRepository userRepository,
                                EmailService emailService) {
        this.staffApplicationRepository = staffApplicationRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    private boolean isSuperAdmin(HttpServletRequest request) {
        return "SUPERADMIN".equals(request.getAttribute("userRole"));
    }

    @GetMapping("/applications/students")
    public ResponseEntity<?> getPendingStudents(HttpServletRequest request) {
        if (!isSuperAdmin(request)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(studentRepository.findByStatus("PENDING_SUPERADMIN"));
    }

    @GetMapping("/applications/staff")
    public ResponseEntity<?> getPendingStaff(HttpServletRequest request) {
        if (!isSuperAdmin(request)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(staffApplicationRepository.findByStatus("PENDING_SUPERADMIN"));
    }

    @PostMapping("/applications/students/{id}/approve")
    public ResponseEntity<?> approveStudent(HttpServletRequest request, @PathVariable Long id, @RequestBody Map<String, Long> payload) {
        if (!isSuperAdmin(request)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        
        Long hostelId = payload.get("hostelId");
        if (hostelId == null) {
            return ResponseEntity.badRequest().body("hostelId is required");
        }

        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            student.setStatus("PENDING_ADMIN"); // Hand off to Admin to assign room
            student.setHostelId(hostelId);
            studentRepository.save(student);

            // Generate temporary password
            String rawPass = UUID.randomUUID().toString().substring(0, 8);
            
            // Create user
            User user = userRepository.findByUsername(student.getEmail()).orElse(new User());
            user.setUsername(student.getEmail());
            user.setPassword(DigestUtils.sha256Hex(rawPass));
            user.setRole("STUDENT");
            user.setName(student.getName());
            user.setStudentId(student.getId());
            userRepository.save(user);

            emailService.sendCredentials(student.getEmail(), student.getName(), student.getEmail(), rawPass);

            return ResponseEntity.ok("Student approved and credentials emailed");
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/applications/staff/{id}/approve")
    public ResponseEntity<?> approveStaff(HttpServletRequest request, @PathVariable Long id, @RequestBody Map<String, Long> payload) {
        if (!isSuperAdmin(request)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        
        Long hostelId = payload.get("hostelId");
        if (hostelId == null) {
            return ResponseEntity.badRequest().body("hostelId is required");
        }

        Optional<StaffApplication> staffOpt = staffApplicationRepository.findById(id);
        if (staffOpt.isPresent()) {
            StaffApplication staff = staffOpt.get();
            staff.setStatus("APPROVED");
            staff.setHostelId(hostelId);
            staffApplicationRepository.save(staff);

            // Generate temporary password
            String rawPass = UUID.randomUUID().toString().substring(0, 8);
            
            // Create user
            User user = userRepository.findByUsername(staff.getEmail()).orElse(new User());
            user.setUsername(staff.getEmail());
            user.setPassword(DigestUtils.sha256Hex(rawPass));
            user.setRole(staff.getRole());
            user.setName(staff.getName());
            userRepository.save(user);

            emailService.sendCredentials(staff.getEmail(), staff.getName(), staff.getEmail(), rawPass);

            return ResponseEntity.ok("Staff approved and credentials emailed");
        }
        return ResponseEntity.notFound().build();
    }
}
