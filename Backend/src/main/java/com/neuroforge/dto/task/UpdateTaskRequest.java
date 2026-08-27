package com.neuroforge.dto.task;

import com.neuroforge.enums.TaskPriority;
import com.neuroforge.enums.TaskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    @NotNull
    private TaskPriority priority;

    @NotNull
    private TaskStatus status;

    @NotNull
    @Min(1)
    @Max(13)
    private Integer storyPoints;

    private List<String> labels;

    private Long requirementId;

    private Long sprintId;

    private Long teamId;

    private Long assigneeId;
}