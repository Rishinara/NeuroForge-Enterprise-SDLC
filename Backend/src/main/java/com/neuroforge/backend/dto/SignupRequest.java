package com.neuroforge.backend.dto;

import com.neuroforge.backend.entity.Role;
import jakarta.validation.constraints.*;

public class SignupRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone is required")
    private String phone;

    @NotNull(message = "Role is required")
    private Role role;

    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    public SignupRequest() {}

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
