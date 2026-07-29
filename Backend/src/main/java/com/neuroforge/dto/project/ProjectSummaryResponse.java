package com.neuroforge.dto.project;

import com.neuroforge.enums.HealthStatus;
import com.neuroforge.enums.ProjectStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ProjectSummaryResponse {
    private Long id;

    private String name;

    private ProjectStatus status;

    private HealthStatus health;

    private LocalDate startDate;

    private LocalDate endDate;

}
