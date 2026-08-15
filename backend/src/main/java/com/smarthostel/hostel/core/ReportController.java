package com.smarthostel.hostel.core;

import com.smarthostel.hostel.meal.MealVerificationRepository;
import com.smarthostel.hostel.meal.MealVerification;
import com.smarthostel.hostel.student.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final MealVerificationRepository mealVerificationRepository;
    private final StudentRepository studentRepository;
    private final com.smarthostel.hostel.auth.UserRepository userRepository;

    public ReportController(MealVerificationRepository mealVerificationRepository, StudentRepository studentRepository, com.smarthostel.hostel.auth.UserRepository userRepository) {
        this.mealVerificationRepository = mealVerificationRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/weekly")
    public ResponseEntity<?> getWeeklyReport(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (!"SUPERADMIN".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        Long userId = (Long) request.getAttribute("userId");
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(7);

        long totalStudents = studentRepository.count();
        long totalMealsVerified = mealVerificationRepository.count();

        if ("ADMIN".equals(role)) {
            Long adminHostelId = 1L;
            if (userId != null) {
                java.util.Optional<com.smarthostel.hostel.auth.User> u = userRepository.findById(userId);
                if (u.isPresent() && u.get().getHostelId() != null) {
                    adminHostelId = u.get().getHostelId();
                }
            }
            final Long targetHostelId = adminHostelId;
            java.util.List<com.smarthostel.hostel.student.Student> hostelStudents = studentRepository.findAll().stream()
                    .filter(s -> targetHostelId.equals(s.getHostelId()))
                    .collect(java.util.stream.Collectors.toList());
            totalStudents = hostelStudents.size();
            java.util.Set<Long> studentIds = hostelStudents.stream().map(com.smarthostel.hostel.student.Student::getId).collect(java.util.stream.Collectors.toSet());

            totalMealsVerified = mealVerificationRepository.findAll().stream()
                    .filter(m -> studentIds.contains(m.getStudentId()))
                    .count();
        }

        Map<String, Object> report = new HashMap<>();
        report.put("startDate", start.toString());
        report.put("endDate", end.toString());
        report.put("totalStudents", totalStudents);
        report.put("totalMealsVerified", totalMealsVerified);
        
        return ResponseEntity.ok(report);
    }
}
