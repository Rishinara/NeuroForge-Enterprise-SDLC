package com.neuroforge.controller;

import com.neuroforge.dto.auth.CreateUserRequest;
import com.neuroforge.dto.auth.UpdateRoleRequest;
import com.neuroforge.dto.auth.UpdateStatusRequest;
import com.neuroforge.dto.auth.UserResponse;
import com.neuroforge.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/create-user")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return adminService.createUser(request);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<UserResponse> getAllUsers() {
        return adminService.getAllUsers();
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UserResponse getUserById(@PathVariable Long id) {
        return adminService.getUserById(id);
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UserResponse updateUserRole(
            @PathVariable Long id,
            @RequestBody UpdateRoleRequest request) {
        return adminService.updateUserRole(id, request);
    }

    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public UserResponse updateUserStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        return adminService.updateUserStatus(id, request);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}