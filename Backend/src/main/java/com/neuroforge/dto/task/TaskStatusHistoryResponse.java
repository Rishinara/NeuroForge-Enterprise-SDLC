package com.neuroforge.dto.task;

import com.neuroforge.enums.TaskStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TaskStatusHistoryResponse {

    private Long id;

    private TaskStatus oldStatus;

    private TaskStatus newStatus;

    private Long changedById;

    private String changedByName;

    private LocalDateTime changedAt;
}