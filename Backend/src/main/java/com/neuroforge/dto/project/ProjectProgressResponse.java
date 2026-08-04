package com.neuroforge.dto.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectProgressResponse {
    private Long projectId;
    private int totalTasks;
    private int completedTasks;
    private int totalStoryPoints;
    private int completedStoryPoints;
    private double taskCompletionPercentage;
    private double pointCompletionPercentage;
}
