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
public class UpdateProjectRequest {
    private String name;

    private String description;

    private Methodology methodology;

    private LocalDate startDate;

    private LocalDate endDate;

    private ProjectStatus status;

    private HealthStatus health;

    private List<Long> teamMemberIds;

    private List<String> techStack;

}
