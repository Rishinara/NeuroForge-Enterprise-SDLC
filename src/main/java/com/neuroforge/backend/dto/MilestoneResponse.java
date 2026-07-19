package com.neuroforge.backend.dto;

import com.neuroforge.backend.entity.Milestone;
import java.time.LocalDate;

public class MilestoneResponse {

    private Long id;
    private String name;
    private LocalDate dueDate;
    private boolean completed;

    public MilestoneResponse() {
    }

    public MilestoneResponse(Milestone milestone) {
        this.id = milestone.getId();
        this.name = milestone.getName();
        this.dueDate = milestone.getDueDate();
        this.completed = milestone.isCompleted();
    }

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

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
