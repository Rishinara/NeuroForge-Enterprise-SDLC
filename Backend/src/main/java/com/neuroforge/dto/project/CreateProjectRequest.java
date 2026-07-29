package com.neuroforge.dto.project;


import com.neuroforge.enums.Methodology;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    @NotNull(message = "Methodology is required")
    private Methodology methodology;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @Future(message = "End date must be in future")
    private LocalDate endDate;

    @NotNull(message = "Organization is required")
    private Long orgId;

    private List<Long> teamMemberIds;

    private List<String> techStack;
}