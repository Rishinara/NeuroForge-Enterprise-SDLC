package com.neuroforge.dto.project;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectDashboardResponse {
    private long totalProjects;

    private long activeProjects;

    private long completedProjects;

    private long delayedProjects;


}
