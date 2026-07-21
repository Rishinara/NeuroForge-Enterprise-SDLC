package com.neuroforge.backend.dto;

import com.neuroforge.backend.entity.Role;

public class CreateInviteRequest {
    private String email;
    private Long teamId;
    private Role role;

    public CreateInviteRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
