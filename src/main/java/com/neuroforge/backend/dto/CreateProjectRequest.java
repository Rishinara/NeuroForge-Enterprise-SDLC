package com.neuroforge.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class CreateProjectRequest {

    private String name;
    private String description;
    private String methodology; // "AGILE" or "WATERFALL"
    private LocalDate startDate;
    private LocalDate endDate;
    private List<String> techStackTags;
    private Long teamId;
    private List<MilestoneRequest> milestones;

    public CreateProjectRequest() {
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

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public List<MilestoneRequest> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<MilestoneRequest> milestones) {
        this.milestones = milestones;
    }
}
