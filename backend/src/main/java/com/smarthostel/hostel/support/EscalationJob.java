package com.smarthostel.hostel.support;

import com.smarthostel.hostel.communication.EmailService;
import com.smarthostel.hostel.student.Student;
import com.smarthostel.hostel.student.StudentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
public class EscalationJob {

    private final ComplaintRepository complaintRepository;
    private final EmailService emailService;
    private final StudentRepository studentRepository;

    public EscalationJob(ComplaintRepository complaintRepository, EmailService emailService, StudentRepository studentRepository) {
        this.complaintRepository = complaintRepository;
        this.emailService = emailService;
        this.studentRepository = studentRepository;
    }

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * ?")
    public void escalateUnresolvedComplaints() {
        LocalDateTime twoDaysAgo = LocalDateTime.now().minusDays(2);
        
        List<Complaint> staleComplaints = complaintRepository.findAllByStatusAndCreatedAtBefore("OPEN", twoDaysAgo);
        
        for (Complaint complaint : staleComplaints) {
            Optional<Student> studentOpt = studentRepository.findById(complaint.getStudentId());
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                
                String subject = "ESCALATION: Unresolved Complaint #" + complaint.getId();
                String body = "Dear Super Admin,\n\n" +
                              "A complaint has been unresolved for more than 2 days and is being automatically escalated.\n\n" +
                              "Complaint ID: " + complaint.getId() + "\n" +
                              "Student: " + student.getName() + " (ID: " + student.getId() + ")\n" +
                              "Category: " + complaint.getCategory() + "\n" +
                              "Title: " + complaint.getTitle() + "\n" +
                              "Description: " + complaint.getDescription() + "\n" +
                              "Submitted At: " + complaint.getCreatedAt() + "\n\n" +
                              "Please log in to the system to resolve this issue.\n" +
                              "Regards,\nHostelSync System";
                
                // Assuming admin@hostelsync.com is the Super Admin email. 
                // Or you could query the UserRepository for role="SUPERADMIN" and send to them.
                emailService.sendEmail("admin@hostelsync.com", subject, body);
            }
        }
    }
}
