package com.neuroforge.mapper;

import com.neuroforge.dto.task.TaskResponse;
import com.neuroforge.entity.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskResponse mapToResponse(Task task) {

        TaskResponse response = new TaskResponse();

        response.setId(task.getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());

        response.setStatus(task.getStatus());
        response.setPriority(task.getPriority());

        response.setStoryPoints(task.getStoryPoints());

        response.setLabels(task.getLabels());

        response.setRequirementId(task.getRequirementId());

        response.setProjectId(task.getProject().getId());
        response.setProjectName(task.getProject().getName());

        if (task.getSprint() != null) {
            response.setSprintId(task.getSprint().getId());
            response.setSprintName(task.getSprint().getName());
        }

        if (task.getAssignee() != null) {
            response.setAssigneeId(task.getAssignee().getId());
            response.setAssigneeName(task.getAssignee().getFullName());
        }

        response.setReporterId(task.getReporter().getId());
        response.setReporterName(task.getReporter().getFullName());

        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());

        return response;
    }
}