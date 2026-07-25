package com.neuroforge.service;

import com.neuroforge.dto.auth.ForgotPasswordRequest;
import com.neuroforge.dto.auth.ResetPasswordRequest;
import com.neuroforge.dto.auth.SignInRequest;
import com.neuroforge.dto.auth.SignupRequest;
import com.neuroforge.dto.auth.JwtAuthenticationResponse;
import com.neuroforge.enums.Role;
import com.neuroforge.entity.User;
import com.neuroforge.entity.PasswordResetToken;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.repository.PasswordResetTokenRepository;
import com.neuroforge.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    public JwtAuthenticationResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use.");
        }
        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setFullName((request.getFirstName() != null ? request.getFirstName() : "") + " " + (request.getLastName() != null ? request.getLastName() : ""));
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ROLE_USER);
        
        userRepository.save(user);
        
        String jwt = jwtService.generateToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return new JwtAuthenticationResponse(jwt, refreshToken.getToken());
    }

    public JwtAuthenticationResponse signin(SignInRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        String jwt = jwtService.generateToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return new JwtAuthenticationResponse(jwt, refreshToken.getToken());
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken passwordResetToken = new PasswordResetToken(token, user);
            passwordResetTokenRepository.save(passwordResetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), token);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid password reset token."));

        if (passwordResetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(passwordResetToken);
            throw new IllegalArgumentException("Password reset token has expired.");
        }

        User user = passwordResetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(passwordResetToken);
    }
}
