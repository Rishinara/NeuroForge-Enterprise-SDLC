package com.neuroforge.dto;

import jakarta.validation.constraints.NotBlank;

public class TeamRequest {
    @NotBlank(message = "Team name is required")
    private String name;

    public TeamRequest() {}
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
