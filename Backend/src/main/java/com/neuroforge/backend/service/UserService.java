package com.neuroforge.backend.service;

import com.neuroforge.backend.dto.*;
import com.neuroforge.backend.entity.OtpToken;
import com.neuroforge.backend.entity.Organization;
import com.neuroforge.backend.entity.User;
import com.neuroforge.backend.exception.DuplicateResourceException;
import com.neuroforge.backend.exception.InvalidRequestException;
import com.neuroforge.backend.exception.ResourceNotFoundException;
import com.neuroforge.backend.repository.OtpTokenRepository;
import com.neuroforge.backend.repository.OrganizationRepository;
import com.neuroforge.backend.repository.UserRepository;
import com.neuroforge.backend.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
                       OrganizationRepository organizationRepository,
                       OtpTokenRepository otpTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        if (userRepository.existsByPhoneNumber(request.getPhone())) {
            throw new DuplicateResourceException("Phone number already exists");
        }

        // ORG_ADMIN gets a new organization; others join via invite
        Organization org = null;
        if (request.getRole().name().equals("ORG_ADMIN")) {
            org = organizationRepository.save(new Organization(request.getFullName() + "'s Org"));
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setPhoneNumber(request.getPhone());
        user.setCreatedAt(LocalDateTime.now());
        user.setOrganization(org);

        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return buildAuthResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid password");
        }
        if (!user.isEnabled()) {
            throw new InvalidRequestException("Your account has been disabled.");
        }

        String token = jwtService.generateToken(user);
        return buildAuthResponse(token, user);
    }

    public AuthResponse.UserPayload getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toPayload(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Silently succeed even if email not found (security best practice)
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            otpTokenRepository.deleteByEmail(request.getEmail());
            String otp = String.format("%06d", new Random().nextInt(999999));
            otpTokenRepository.save(new OtpToken(request.getEmail(), otp, LocalDateTime.now().plusMinutes(15)));

            // Log OTP to console (replace with real email sender in production)
            System.out.println("=== PASSWORD RESET OTP for " + request.getEmail() + " : " + otp + " ===");
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        OtpToken otpToken = otpTokenRepository.findTopByEmailOrderByIdDesc(request.getEmail())
                .orElseThrow(() -> new InvalidRequestException("No OTP found for this email."));

        if (otpToken.isUsed()) throw new InvalidRequestException("OTP has already been used.");
        if (otpToken.getExpiresAt().isBefore(LocalDateTime.now())) throw new InvalidRequestException("OTP has expired.");
        if (!otpToken.getOtp().equals(request.getOtp())) throw new InvalidRequestException("Invalid OTP.");

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);
    }

    // ---- helpers ----

    private AuthResponse buildAuthResponse(String token, User user) {
        return new AuthResponse(token, toPayload(user));
    }

    private AuthResponse.UserPayload toPayload(User user) {
        Long orgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        String orgName = user.getOrganization() != null ? user.getOrganization().getName() : null;
        return new AuthResponse.UserPayload(user.getId(), user.getEmail(), user.getFullName(), orgId, orgName, user.getRole());
    }
}
