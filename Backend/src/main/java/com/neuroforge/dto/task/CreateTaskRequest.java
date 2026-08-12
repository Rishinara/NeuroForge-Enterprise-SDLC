package com.neuroforge.dto.task;

import com.neuroforge.enums.TaskPriority;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    @NotNull(message = "Priority is required")
    private TaskPriority priority;

    @NotNull(message = "Story points are required")
    @Min(value = 1, message = "Minimum story points is 1")
    @Max(value = 13, message = "Maximum story points is 13")
    private Integer storyPoints;

    private List<String> labels;

    private Long requirementId;

    private Long sprintId;

    private Long teamId;

    private Long assigneeId;
}