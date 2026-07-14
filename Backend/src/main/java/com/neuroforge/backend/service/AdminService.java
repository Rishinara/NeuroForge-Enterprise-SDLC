package com.neuroforge.backend.service;

import com.neuroforge.backend.dto.CreateUserRequest;
import com.neuroforge.backend.dto.UpdateRoleRequest;
import com.neuroforge.backend.dto.UpdateStatusRequest;
import com.neuroforge.backend.dto.UserResponse;
import com.neuroforge.backend.entity.Role;
import com.neuroforge.backend.entity.User;
import com.neuroforge.backend.exception.DuplicateResourceException;
import com.neuroforge.backend.exception.InvalidRequestException;
import com.neuroforge.backend.exception.ResourceNotFoundException;
import com.neuroforge.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

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

        // Encrypt password
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Assign selected role
        user.setRole(request.getRole());

        user.setCreatedAt(LocalDateTime.now());
        user.setPhoneNumber(request.getPhoneNumber());

          userRepository.save(user);
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

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole(),
                        user.getCreatedAt(),
                        user.isEnabled(),
                        user.getPhoneNumber()
                ))
                .toList();
    }

    public UserResponse getUserById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

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
    public UserResponse updateUserRole(Long id, UpdateRoleRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setRole(request.getRole());

        User updatedUser = userRepository.save(user);

        return new UserResponse(
                updatedUser.getId(),
                updatedUser.getFullName(),
                updatedUser.getEmail(),
                updatedUser.getRole(),
                updatedUser.getCreatedAt(),
                updatedUser.isEnabled(),
                updatedUser.getPhoneNumber()
        );
    }

    public UserResponse updateUserStatus(Long id, UpdateStatusRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setEnabled(request.isEnabled());

        User updatedUser = userRepository.save(user);

        return new UserResponse(
                updatedUser.getId(),
                updatedUser.getFullName(),
                updatedUser.getEmail(),
                updatedUser.getRole(),
                updatedUser.getCreatedAt(),
                updatedUser.isEnabled(),
                updatedUser.getPhoneNumber()
        );
    }

    public String deleteUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new InvalidRequestException("Super Admin cannot be deleted.");
        }

        userRepository.delete(user);

        return "User deleted successfully";
    }
}