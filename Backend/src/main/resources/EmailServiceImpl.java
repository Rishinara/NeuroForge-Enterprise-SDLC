package com.neuroforge.service.impl;

import com.neuroforge.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Override
    @Async
    public void sendPasswordResetEmail(String to, String token) {
        try {
            mailSender.send(mimeMessage -> {
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                helper.setTo(to);
                helper.setSubject("Reset Your NeuroForge Password");
                String resetUrl = frontendBaseUrl + "/reset-password?token=" + token;
                String htmlContent = "<h3>Reset Your Password</h3>"
                        + "<p>You have requested to reset your password. Click the link below to proceed:</p>"
                        + "<a href=\"" + resetUrl + "\">Reset Password</a>"
                        + "<p>If you did not request this, please ignore this email.</p>";
                helper.setText(htmlContent, true);
            });
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", to, e.getMessage());
            // In a real application, you might add this to a retry queue
        }
    }
}