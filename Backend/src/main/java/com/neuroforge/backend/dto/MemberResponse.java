package com.neuroforge.backend.dto;

import com.neuroforge.backend.entity.Role;

public class MemberResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;

    public MemberResponse(Long id, String name, String email, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
}
