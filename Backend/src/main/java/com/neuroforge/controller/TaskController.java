package com.neuroforge.controller;

import com.neuroforge.dto.board.BoardResponse;
import com.neuroforge.dto.task.*;
import com.neuroforge.service.SprintService;
import com.neuroforge.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final SprintService sprintService;

    @PostMapping("/projects/{projectId}/backlog")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN', 'ORG_ADMIN')")
    public TaskResponse createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return taskService.createTask(
                projectId,
                request,
                userDetails.getUsername());
    }

    @PutMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN', 'ORG_ADMIN')")
    public TaskResponse updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return taskService.updateTask(
                taskId,
                request,
                userDetails.getUsername());
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN', 'ORG_ADMIN')")
    public void deleteTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {

        taskService.deleteTask(
                taskId,
                userDetails.getUsername());
    }

    @GetMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'DEVELOPER', 'QA_TESTER', 'CLIENT', 'ORG_ADMIN')")
    public TaskResponse getTaskById(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return taskService.getTaskById(
                taskId,
                userDetails.getUsername());
    }

    @GetMapping("/project/{projectId}/backlog")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'DEVELOPER', 'QA_TESTER', 'CLIENT', 'ORG_ADMIN')")
    public List<TaskResponse> getProjectBacklog(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return taskService.getProjectBacklog(
                projectId,
                userDetails.getUsername());
    }

    @PostMapping("/{taskId}/assign-sprint/{sprintId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN', 'ORG_ADMIN')")
    public TaskResponse assignTaskToSprint(
            @PathVariable Long taskId,
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return taskService.assignTaskToSprint(
                taskId,
                sprintId,
                userDetails.getUsername());
    }

    @PostMapping("/{taskId}/remove-sprint")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN', 'ORG_ADMIN')")
    public TaskResponse removeTaskFromSprint(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return taskService.removeTaskFromSprint(
                taskId,
                userDetails.getUsername());
    }

    @PatchMapping("/{taskId}/status")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'DEVELOPER', 'QA_TESTER', 'ORG_ADMIN')")
    public TaskResponse updateTaskStatus(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return taskService.updateTaskStatus(
                taskId,
                request,
                userDetails.getUsername());
    }

    @GetMapping("/{taskId}/history")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'DEVELOPER', 'QA_TESTER', 'CLIENT', 'ORG_ADMIN')")
    public List<TaskStatusHistoryResponse> getTaskStatusHistory(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return taskService.getTaskStatusHistory(
                taskId,
                userDetails.getUsername());
    }

    @GetMapping("/{sprintId}/board")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'DEVELOPER', 'QA_TESTER', 'CLIENT', 'ORG_ADMIN')")
    public BoardResponse getSprintBoard(
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return sprintService.getSprintBoard(
                sprintId,
                userDetails.getUsername());
    }
}