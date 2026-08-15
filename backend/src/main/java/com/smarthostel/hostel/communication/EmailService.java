package com.smarthostel.hostel.communication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String to, String subject, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, true); // true indicates HTML
            
            mailSender.send(message);
            logger.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            logger.error("Failed to send email to {}", to, e);
            // Non-blocking failure for now, just log it.
        }
    }

    public void sendCredentials(String to, String name, String username, String password) {
        String subject = "SmartHostel Account Credentials";
        String body = String.format(
            "<h3>Welcome to SmartHostel, %s!</h3>" +
            "<p>Your application has been approved.</p>" +
            "<p>Here are your login credentials:</p>" +
            "<ul>" +
            "<li><b>Username:</b> %s</li>" +
            "<li><b>Password:</b> %s</li>" +
            "</ul>" +
            "<p>Please log in and change your password immediately.</p>",
            name, username, password
        );
        sendEmail(to, subject, body);
    }
    
    public void sendOtp(String to, String name, String otp) {
        String subject = "SmartHostel Password Reset OTP";
        String body = String.format(
            "<h3>Hello %s,</h3>" +
            "<p>You have requested to reset your password.</p>" +
            "<p>Your OTP is: <b>%s</b></p>" +
            "<p>This OTP is valid for 10 minutes.</p>",
            name, otp
        );
        sendEmail(to, subject, body);
    }
}
