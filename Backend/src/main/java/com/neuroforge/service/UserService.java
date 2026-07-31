package com.neuroforge.service;

import com.neuroforge.dto.auth.*;

import com.neuroforge.entity.OtpToken;
import com.neuroforge.entity.Organization;
import com.neuroforge.entity.User;
import com.neuroforge.enums.Role;
import com.neuroforge.exception.DuplicateResourceException;
import com.neuroforge.exception.InvalidRequestException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.OtpTokenRepository;
import com.neuroforge.repository.OrganizationRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public UserService(UserRepository userRepository,
                       OrganizationRepository organizationRepository,
                       OtpTokenRepository otpTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        if (userRepository.existsByPhoneNumber(request.getPhone())) {
            throw new DuplicateResourceException("Phone number already exists");
        }

        // Prevent self-assignment of privileged roles via public signup
        if (request.getRole() == Role.SUPER_ADMIN) {
            throw new InvalidRequestException("SUPER_ADMIN role cannot be self-assigned.");
        }

        Organization org = null;
        if (request.getRole().name().equals("ORG_ADMIN")) {
            org = organizationRepository.save(new Organization(request.getFullName() + "'s Org"));
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : Role.DEVELOPER);
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

    public AuthResponse refreshTokenV2(java.util.Map<String, String> body) {
        String expiredToken = body.get("token");
        String email = jwtService.extractEmailFromExpiredToken(expiredToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.isEnabled()) {
            throw new InvalidRequestException("Account disabled");
        }
        String newToken = jwtService.generateToken(user);
        return buildAuthResponse(newToken, user);
    }

    public AuthResponse.UserPayload getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toPayload(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            otpTokenRepository.deleteByEmail(request.getEmail());
            String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
            otpTokenRepository.save(new OtpToken(request.getEmail(), otp, LocalDateTime.now().plusMinutes(5)));
            log.info("PASSWORD RESET OTP for [{}] generated",
                    request.getEmail().replaceAll("(?<=.{3}).(?=.*@)", "*"));
            emailService.sendOtpEmail(user.getEmail(), otp);
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

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProfileResponse response = new ProfileResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setRole(user.getRole());
        response.setCreatedAt(user.getCreatedAt());

        if (user.getOrganization() != null) {
            response.setOrganizationName(user.getOrganization().getName());
        }
        return response;
    }

    @Transactional
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        userRepository.save(user);
        return getProfile(email);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadCredentialsException("Old password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ---- helpers ----

    private AuthResponse buildAuthResponse(String token, User user) {
        return new AuthResponse(token, toPayload(user));
    }

    private AuthResponse.UserPayload toPayload(User user) {
        Long orgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        String orgName = user.getOrganization() != null ? user.getOrganization().getName() : null;
        return new AuthResponse.UserPayload(
                user.getId(), user.getEmail(), user.getFullName(), orgId, orgName, user.getRole());
    }
}
