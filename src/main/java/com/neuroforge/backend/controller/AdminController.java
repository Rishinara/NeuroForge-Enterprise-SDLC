package com.neuroforge.backend.controller;

import com.neuroforge.backend.dto.CreateUserRequest;
import com.neuroforge.backend.dto.UpdateRoleRequest;
import com.neuroforge.backend.dto.UpdateStatusRequest;
import com.neuroforge.backend.dto.UserResponse;
import com.neuroforge.backend.entity.User;
import com.neuroforge.backend.service.AdminService;
import jakarta.validation.Valid;
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
    @PreAuthorize("hasRole('SUPER_ADMIN')")     //only superadmin can access this page
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
    public String deleteUser(@PathVariable Long id) {

        return adminService.deleteUser(id);
    }



}