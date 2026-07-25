package com.neuroforge.dto.websocket;

import com.neuroforge.enums.TaskStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskStatusUpdateEvent {

    private Long taskId;

    private String taskTitle;

    private Long sprintId;

    private Long projectId;

    private TaskStatus oldStatus;

    private TaskStatus newStatus;

    private Long updatedById;

    private String updatedByName;
}