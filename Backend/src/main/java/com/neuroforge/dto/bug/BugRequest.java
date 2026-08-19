package com.neuroforge.dto.bug;

import com.neuroforge.enums.BugStatus;
import com.neuroforge.enums.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BugRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private BugStatus status;

    private TaskPriority priority;

    private TaskPriority severity;

    private Long projectId;

    private Long sprintId;

    private Long taskId;

    private Long assigneeId;

    private String stepsToReproduce;

    private String expectedResult;

    private String actualResult;

    private String attachmentUrl;

    private String retestComments;
}
