package com.neuroforge.service;

import com.neuroforge.dto.auth.CreateUserRequest;
import com.neuroforge.dto.auth.UpdateRoleRequest;
import com.neuroforge.dto.auth.UpdateStatusRequest;
import com.neuroforge.dto.auth.UserResponse;
import com.neuroforge.enums.Role;
import com.neuroforge.entity.User;
import com.neuroforge.exception.DuplicateResourceException;
import com.neuroforge.exception.InvalidRequestException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new DuplicateResourceException("Phone number already exists");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setCreatedAt(LocalDateTime.now());
        user.setPhoneNumber(request.getPhoneNumber());

        return toUserResponse(userRepository.save(user));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .toList();
    }

    public UserResponse getUserById(Long id) {
        return toUserResponse(findUserOrThrow(id));
    }

    @Transactional
    public UserResponse updateUserRole(Long id, UpdateRoleRequest request) {
        User user = findUserOrThrow(id);
        user.setRole(request.getRole());
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, UpdateStatusRequest request) {
        User user = findUserOrThrow(id);
        user.setEnabled(request.isEnabled());
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = findUserOrThrow(id);
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new InvalidRequestException("Super Admin cannot be deleted.");
        }
        userRepository.delete(user);
    }

    // ---- helpers ----

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.isEnabled(),
                user.getPhoneNumber()
        );
    }
}
