package com.smarthostel.hostel.auth;

import com.smarthostel.hostel.student.Student;
import com.smarthostel.hostel.auth.User;
import com.smarthostel.hostel.student.StudentRepository;
import com.smarthostel.hostel.auth.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public OAuth2SuccessHandler(JwtUtil jwtUtil, StudentRepository studentRepository, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null) {
            getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/?error=EmailNotProvidedByGoogle");
            return;
        }

        // 1. Check if User account already exists
        Optional<User> userOpt = userRepository.findByUsername(email);
        User user;

        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            // 2. Check if Student record exists
            Optional<Student> studentOpt = studentRepository.findByEmail(email);
            Student student;
            if (studentOpt.isPresent()) {
                student = studentOpt.get();
            } else {
                // Auto-create Student record for new Google user
                student = new Student();
                student.setName(name != null ? name : email.split("@")[0]);
                student.setEmail(email);
                student.setPhone("+1000000000");
                student.setDepartment("General");
                student.setYear(1);
                student.setHostelId(1L);
                student.setStatus("ACTIVE");
                student.setQrToken("ST-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + java.time.LocalDate.now().toString().replace("-", ""));
                student = studentRepository.save(student);
            }

            // Auto-create User account linked to Student
            user = new User();
            user.setUsername(email);
            user.setPassword("OAUTH2_USER_" + java.util.UUID.randomUUID().toString()); // Non-blank password to satisfy @NotBlank constraint
            user.setRole("STUDENT");
            user.setName(student.getName());
            user.setStudentId(student.getId());
            user.setHostelId(student.getHostelId() != null ? student.getHostelId() : 1L);
            user = userRepository.save(user);
        }

        // 3. Generate JWT Token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        // 4. Redirect to Frontend with Token
        getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/oauth2/redirect?token=" + token);
    }
}
