package com.neuroforge.dto.bug;

import com.neuroforge.enums.BugStatus;
import com.neuroforge.enums.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BugRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Status is required")
    private BugStatus status;

    @NotNull(message = "Priority is required")
    private TaskPriority priority;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private Long sprintId;

    private Long assigneeId;
}
