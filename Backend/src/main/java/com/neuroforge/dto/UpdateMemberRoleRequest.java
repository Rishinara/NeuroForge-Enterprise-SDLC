package com.neuroforge.dto;

import com.neuroforge.entity.Role;

public class UpdateMemberRoleRequest {
    private Role role;

    public UpdateMemberRoleRequest() {}

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
