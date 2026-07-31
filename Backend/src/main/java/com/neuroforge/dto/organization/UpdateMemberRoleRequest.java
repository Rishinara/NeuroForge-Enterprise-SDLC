package com.neuroforge.dto.organization;

import com.neuroforge.enums.Role;

public class UpdateMemberRoleRequest {
    private Role role;

    public UpdateMemberRoleRequest() {}

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
