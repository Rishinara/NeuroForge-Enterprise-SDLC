package com.neuroforge.dto.sprint;

import com.neuroforge.enums.SprintStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SprintResponse {

    private Long id;

    private String name;

    private String goal;

    private LocalDate startDate;

    private LocalDate endDate;

    private SprintStatus status;

    private Long projectId;

    private String projectName;

    private Long createdById;

    private String createdByName;
}