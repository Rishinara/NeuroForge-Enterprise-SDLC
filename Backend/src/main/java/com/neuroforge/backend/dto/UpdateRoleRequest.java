package com.neuroforge.backend.dto;

import com.neuroforge.backend.entity.Role;

public class UpdateRoleRequest {

    private Role role;

    public UpdateRoleRequest() {
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}