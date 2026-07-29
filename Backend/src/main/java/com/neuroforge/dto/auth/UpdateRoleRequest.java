package com.neuroforge.dto.auth;

import com.neuroforge.enums.Role;

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