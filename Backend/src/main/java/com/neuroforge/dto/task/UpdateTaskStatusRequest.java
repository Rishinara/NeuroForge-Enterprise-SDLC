package com.neuroforge.dto.task;

import com.neuroforge.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTaskStatusRequest {

    @NotNull(message = "Task status is required")
    private TaskStatus status;
}