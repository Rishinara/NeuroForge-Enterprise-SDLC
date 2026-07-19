package com.neuroforge.backend.dto;

import java.time.LocalDate;

public class MilestoneRequest {

    private String name;
    private LocalDate dueDate;

    public MilestoneRequest() {
    }

    public MilestoneRequest(String name, LocalDate dueDate) {
        this.name = name;
        this.dueDate = dueDate;
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
}
