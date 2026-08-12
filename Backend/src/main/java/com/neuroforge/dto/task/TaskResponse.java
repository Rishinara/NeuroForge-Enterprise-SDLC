package com.neuroforge.dto.task;

import com.neuroforge.enums.TaskPriority;
import com.neuroforge.enums.TaskStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class TaskResponse {

    private Long id;

    private String title;

    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    private Integer storyPoints;

    private List<String> labels;

    private Long requirementId;

    private Long projectId;
    private String projectName;

    private Long sprintId;
    private String sprintName;

    private Long teamId;
    private String teamName;

    private Long assigneeId;
    private String assigneeName;

    private Long reporterId;
    private String reporterName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}