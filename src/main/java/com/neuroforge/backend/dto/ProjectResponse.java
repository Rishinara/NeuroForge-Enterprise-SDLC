package com.neuroforge.backend.dto;

import com.neuroforge.backend.entity.Project;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ProjectResponse {

    private Long id;
    private String name;
    private String description;
    private String methodology;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<String> techStackTags;
    private String healthStatus;
    private Long orgId;
    private String orgName;
    private Long teamId;
    private String teamName;
    private List<UserSummary> members;
    private List<MilestoneResponse> milestones;
    private LocalDateTime createdAt;

    public ProjectResponse() {
    }

    public ProjectResponse(Project project) {
        this.id = project.getId();
        this.name = project.getName();
        this.description = project.getDescription();
        this.methodology = project.getMethodology();
        this.startDate = project.getStartDate();
        this.endDate = project.getEndDate();
        this.techStackTags = project.getTechStackTags();
        this.healthStatus = project.getHealthStatus();
        this.createdAt = project.getCreatedAt();

        if (project.getOrganization() != null) {
            this.orgId = project.getOrganization().getId();
            this.orgName = project.getOrganization().getName();
        }

        if (project.getTeam() != null) {
            this.teamId = project.getTeam().getId();
            this.teamName = project.getTeam().getName();
        }

        if (project.getMembers() != null) {
            this.members = project.getMembers().stream()
                    .map(UserSummary::new)
                    .collect(Collectors.toList());
        }

        if (project.getMilestones() != null) {
            this.milestones = project.getMilestones().stream()
                    .map(MilestoneResponse::new)
                    .collect(Collectors.toList());
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMethodology() {
        return methodology;
    }

    public void setMethodology(String methodology) {
        this.methodology = methodology;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public List<String> getTechStackTags() {
        return techStackTags;
    }

    public void setTechStackTags(List<String> techStackTags) {
        this.techStackTags = techStackTags;
    }

    public String getHealthStatus() {
        return healthStatus;
    }

    public void setHealthStatus(String healthStatus) {
        this.healthStatus = healthStatus;
    }

    public Long getOrgId() {
        return orgId;
    }

    public void setOrgId(Long orgId) {
        this.orgId = orgId;
    }

    public String getOrgName() {
        return orgName;
    }

    public void setOrgName(String orgName) {
        this.orgName = orgName;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public List<UserSummary> getMembers() {
        return members;
    }

    public void setMembers(List<UserSummary> members) {
        this.members = members;
    }

    public List<MilestoneResponse> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<MilestoneResponse> milestones) {
        this.milestones = milestones;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class UserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String role;

        public UserSummary() {
        }

        public UserSummary(com.neuroforge.backend.entity.User user) {
            this.id = user.getId();
            this.fullName = user.getFullName();
            this.email = user.getEmail();
            if (user.getRole() != null) {
                this.role = user.getRole().name();
            }
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}
