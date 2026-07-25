package com.neuroforge.dto.project;

import com.neuroforge.enums.HealthStatus;
import com.neuroforge.enums.Methodology;
import com.neuroforge.enums.ProjectStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;


@Getter
@Setter
public class ProjectResponse {
    private Long id;

    private String name;

    private String description;

    private Methodology methodology;

    private ProjectStatus status;

    private HealthStatus health;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<String> techStack;

    private List<ProjectMemberResponse> team;

    private Integer teamSize;

    private Integer progressPercent;
}
