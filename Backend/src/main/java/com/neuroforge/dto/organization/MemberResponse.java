package com.neuroforge.dto.organization;

import com.neuroforge.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

import lombok.NoArgsConstructor;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MemberResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Role role;
    private boolean enabled;
    private LocalDateTime joinedAt;
    private List<String> teams;
    private Boolean assignedToProject;
    private String assignedProjectName;
    private int activeProjectCount;

    public MemberResponse(Long id, String fullName, String email, String phoneNumber, Role role, boolean enabled, LocalDateTime joinedAt, List<String> teams) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.enabled = enabled;
        this.joinedAt = joinedAt;
        this.teams = teams;
        this.assignedToProject = false;
        this.assignedProjectName = null;
        this.activeProjectCount = 0;
    }
}