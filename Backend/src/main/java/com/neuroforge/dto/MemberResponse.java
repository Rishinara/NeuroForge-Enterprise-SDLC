package com.neuroforge.dto;

import com.neuroforge.entity.Role;

import java.time.LocalDateTime;
import java.util.List;

public class MemberResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Role role;
    private boolean enabled;
    private LocalDateTime joinedAt;
    private List<String> teams;

    public MemberResponse(Long id,
                          String fullName,
                          String email,
                          String phoneNumber,
                          Role role,
                          boolean enabled,
                          LocalDateTime joinedAt,
                          List<String> teams) {

        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.enabled = enabled;
        this.joinedAt = joinedAt;
        this.teams = teams;
    }

    public Long getId() { return id; }

    public String getFullName() { return fullName; }

    public String getEmail() { return email; }

    public String getPhoneNumber() { return phoneNumber; }

    public Role getRole() { return role; }

    public boolean isEnabled() { return enabled; }

    public LocalDateTime getJoinedAt() { return joinedAt; }

    public List<String> getTeams() { return teams; }
}