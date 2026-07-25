package com.neuroforge.dto.sprintsummary;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SprintSummaryResponse {

    private Long sprintId;

    private String sprintName;

    private Integer totalTasks;

    private Integer completedTasks;

    private Integer pendingTasks;

    private Integer totalStoryPoints;

    private Integer completedStoryPoints;

    private Integer remainingStoryPoints;

    private Double completionPercentage;
}