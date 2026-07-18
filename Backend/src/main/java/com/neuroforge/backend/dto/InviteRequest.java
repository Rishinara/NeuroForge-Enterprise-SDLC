package com.neuroforge.backend.dto;

import com.neuroforge.backend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class InviteRequest {

    @NotBlank @Email
    private String email;

    @NotNull
    private Role role;

    @NotNull
    private Long teamId;

    public InviteRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Long getTeamId() {return teamId;}
    public void setTeamId(Long teamId) {this.teamId = teamId;}

}
