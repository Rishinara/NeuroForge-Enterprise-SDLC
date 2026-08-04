package com.neuroforge.service;

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
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

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
        }
    }

    @Async
    public void sendOtpEmail(String to, String otp) {
        try {
            mailSender.send(mimeMessage -> {
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                helper.setTo(to);
                helper.setSubject("NeuroForge Password Reset OTP");
                String htmlContent = "<h3>Reset Your Password</h3>"
                        + "<p>You have requested to reset your password. Your One-Time Password (OTP) is:</p>"
                        + "<h2 style=\"color: #4A90E2; letter-spacing: 2px;\">" + otp + "</h2>"
                        + "<p>This OTP is valid for 5 minutes.</p>"
                        + "<p>If you did not request this, please ignore this email.</p>";
                helper.setText(htmlContent, true);
            });
            log.info("OTP email successfully sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
        }
    }

    public void sendInviteEmail(String to, String token, String orgName, String role) {
        try {
            mailSender.send(mimeMessage -> {
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
                helper.setTo(to);
                helper.setSubject("You've been invited to join " + orgName + " on NeuroForge");
                String inviteUrl = frontendBaseUrl + "/invite/" + token;
                String htmlContent = "<h3>You're Invited!</h3>"
                        + "<p>You have been invited to join the organization <strong>" + orgName + "</strong> with the role of <strong>" + role + "</strong>.</p>"
                        + "<p>Click the link below to accept the invitation and join your team:</p>"
                        + "<a href=\"" + inviteUrl + "\">Accept Invitation</a>"
                        + "<p>This invitation will expire in 7 days.</p>"
                        + "<p>If you did not expect this invitation, please ignore this email.</p>";
                helper.setText(htmlContent, true);
            });
            log.info("Invite email successfully sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send invite email to {}: {}", to, e.getMessage());
            log.info("MOCKED: Would have sent invite link: " + frontendBaseUrl + "/invite/" + token);
        }
    }
}
