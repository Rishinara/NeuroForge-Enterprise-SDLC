package com.neuroforge.service.impl;

import com.neuroforge.dto.task.*;
import com.neuroforge.dto.websocket.TaskStatusUpdateEvent;
import com.neuroforge.entity.*;
import com.neuroforge.enums.SprintStatus;
import com.neuroforge.enums.TaskStatus;
import com.neuroforge.exception.InvalidRequestException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.*;
import com.neuroforge.service.TaskService;
import com.neuroforge.websocket.TaskEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskEventPublisher taskEventPublisher;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final TaskStatusHistoryRepository taskStatusHistoryRepository;
    private final TeamRepository teamRepository;
    private final com.neuroforge.service.NotificationService notificationService;
    private final com.neuroforge.service.ActivityService activityService;

    private TaskResponse mapToResponse(Task task) {

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

        if (task.getTeam() != null) {
            response.setTeamId(task.getTeam().getId());
            response.setTeamName(task.getTeam().getName());
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

    private TaskStatusHistoryResponse mapToHistoryResponse(
            TaskStatusHistory history) {

        TaskStatusHistoryResponse response =
                new TaskStatusHistoryResponse();

        response.setId(history.getId());

        response.setOldStatus(history.getOldStatus());

        response.setNewStatus(history.getNewStatus());

        response.setChangedById(history.getChangedBy().getId());

        response.setChangedByName(
                history.getChangedBy().getFullName());

        response.setChangedAt(history.getChangedAt());

        return response;
    }


    @Override
    public TaskResponse createTask(Long projectId, CreateTaskRequest request,
                                   String loggedInEmail) {

        User reporter = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Project not found"));

        Sprint sprint = null;

        if (request.getSprintId() != null) {

            sprint = sprintRepository.findSprintById(request.getSprintId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Sprint not found"));

            if (!sprint.getProject().getId().equals(project.getId())) {
                throw new InvalidRequestException(
                        "Sprint does not belong to the selected project");
            }

// Allowed: sprint will auto-reactivate if non-done task added
        }

        Team team = null;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Team not found"));
        }

        User assignee = null;

        if (request.getAssigneeId() != null) {

            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Assignee not found"));
                            
            if (team != null && !team.getUsers().contains(assignee)) {
                throw new InvalidRequestException("Assignee does not belong to the selected team");
            }
        }

        Task task = new Task();

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());

        task.setPriority(request.getPriority());
        task.setStatus(TaskStatus.TODO);

        task.setStoryPoints(request.getStoryPoints());

        task.setRequirementId(request.getRequirementId());

        task.setLabels(
                request.getLabels() == null
                        ? new ArrayList<>()
                        : request.getLabels()
        );

        task.setProject(project);
        task.setSprint(sprint);

        task.setReporter(reporter);
        task.setTeam(team);
        task.setAssignee(assignee);

        Task savedTask = taskRepository.save(task);
        
        if (assignee != null && sprint != null) {
             notificationService.createNotification(assignee, "New task assigned", "You have been assigned '" + savedTask.getTitle() + "' in " + sprint.getName() + ".", "TASK_ASSIGNED", savedTask.getId());
        }

        Task loadedTask = taskRepository.findTaskById(savedTask.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        return mapToResponse(loadedTask);

    }

    @Override
    public TaskResponse updateTask(Long taskId,
                                   UpdateTaskRequest request,
                                   String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        Sprint sprint = null;

        if (request.getSprintId() != null) {

            sprint = sprintRepository.findSprintById(request.getSprintId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Sprint not found"));

            if (!sprint.getProject().getId().equals(task.getProject().getId())) {
                throw new InvalidRequestException(
                        "Sprint does not belong to the task project");
            }

// Allowed: sprint will auto-reactivate if non-done task added
        }

        Team team = null;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Team not found"));
        }

        User assignee = null;

        if (request.getAssigneeId() != null) {

            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Assignee not found"));
                            
            if (team != null && !team.getUsers().contains(assignee)) {
                throw new InvalidRequestException("Assignee does not belong to the selected team");
            }
        }
        
        boolean notifyNewAssignee = false;
        if (assignee != null && sprint != null) {
            if (task.getAssignee() == null || !task.getAssignee().getId().equals(assignee.getId()) || task.getSprint() == null || !task.getSprint().getId().equals(sprint.getId())) {
                notifyNewAssignee = true;
            }
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setStatus(request.getStatus());
        task.setStoryPoints(request.getStoryPoints());
        task.setRequirementId(request.getRequirementId());

        task.setLabels(
                request.getLabels() == null
                        ? new ArrayList<>()
                        : request.getLabels()
        );

        Sprint oldSprint = task.getSprint();
        task.setSprint(sprint);
        task.setTeam(team);
        task.setAssignee(assignee);

        taskRepository.save(task);
        if (oldSprint != null) {
            checkAndUpdateSprintStatus(oldSprint);
        }
        if (sprint != null && (oldSprint == null || !oldSprint.getId().equals(sprint.getId()))) {
            checkAndUpdateSprintStatus(sprint);
        }
        
        if (notifyNewAssignee) {
             notificationService.createNotification(assignee, "New task assigned", "You have been assigned '" + task.getTitle() + "' in " + sprint.getName() + ".", "TASK_ASSIGNED", task.getId());
        }

        Task updatedTask = taskRepository.findTaskById(task.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        return mapToResponse(updatedTask);
    }

    @Override
    public void deleteTask(Long taskId,
                           String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        Sprint sprint = task.getSprint();
        taskRepository.delete(task);
        if (sprint != null) {
            checkAndUpdateSprintStatus(sprint);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long taskId,
                                    String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));


        return mapToResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getProjectBacklog(Long projectId,
                                                String loggedInEmail) {

        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Project not found"));
                        
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }

        return taskRepository.findByProjectIdAndSprintIsNull(projectId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public TaskResponse assignTaskToSprint(Long taskId,
                                           Long sprintId,
                                           String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        Sprint sprint = sprintRepository.findSprintById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        if (!task.getProject().getId().equals(sprint.getProject().getId())) {
            throw new InvalidRequestException(
                    "Task and Sprint belong to different projects");
        }

// Allowed: sprint will auto-reactivate if non-done task added

        boolean wasInSprint = task.getSprint() != null;
        Sprint prevSprint = task.getSprint();
        task.setSprint(sprint);

        taskRepository.save(task);
        if (prevSprint != null) {
            checkAndUpdateSprintStatus(prevSprint);
        }
        if (sprint != null) {
            checkAndUpdateSprintStatus(sprint);
        }
        
        if (!wasInSprint && task.getAssignee() != null) {
             notificationService.createNotification(task.getAssignee(), "New task assigned", "You have been assigned '" + task.getTitle() + "' in " + sprint.getName() + ".", "TASK_ASSIGNED", task.getId());
        }

        Task updatedTask = taskRepository.findTaskById(task.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        return mapToResponse(updatedTask);
    }

    @Override
    @Transactional
    public TaskResponse removeTaskFromSprint(Long taskId,
                                             String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        if (task.getSprint() == null) {
            throw new InvalidRequestException(
                    "Task is already in the backlog");
        }

        Sprint prevSprint = task.getSprint();
        task.setSprint(null);

        taskRepository.save(task);
        if (prevSprint != null) {
            checkAndUpdateSprintStatus(prevSprint);
        }

        Task updatedTask = taskRepository.findTaskById(task.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        return mapToResponse(updatedTask);
    }

    //<---------------------------kanban-board-------------------->

    private boolean isValidStatusTransition(TaskStatus current,
                                            TaskStatus next) {

        if (current == next) {return true;}

        return switch (current) {

            case TODO ->
                    next == TaskStatus.IN_PROGRESS;

            case IN_PROGRESS ->
                    next == TaskStatus.TODO ||
                            next == TaskStatus.CODE_REVIEW;

            case CODE_REVIEW ->
                    next == TaskStatus.IN_PROGRESS ||
                            next == TaskStatus.TESTING;

            case TESTING ->
                    next == TaskStatus.CODE_REVIEW ||
                            next == TaskStatus.DONE;

            case DONE ->
                    next == TaskStatus.TESTING;
        };
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(Long taskId,
                                         UpdateTaskStatusRequest request,
                                         String loggedInEmail) {

        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Task task = taskRepository.findTaskById(taskId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        if (user.getRole() == com.neuroforge.enums.Role.DEVELOPER) {
            if (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You can only update your assigned tasks.");
            }
        }
        
        if (user.getRole() == com.neuroforge.enums.Role.DEVELOPER) {
            boolean isToDoToInProgress = task.getStatus() == com.neuroforge.enums.TaskStatus.TODO && request.getStatus() == com.neuroforge.enums.TaskStatus.IN_PROGRESS;
            boolean isInProgressToCodeReview = task.getStatus() == com.neuroforge.enums.TaskStatus.IN_PROGRESS && request.getStatus() == com.neuroforge.enums.TaskStatus.CODE_REVIEW;
            if (!isToDoToInProgress && !isInProgressToCodeReview) {
                throw new org.springframework.security.access.AccessDeniedException("Developers can only move tasks from To Do to In Progress or Code Review.");
            }
        }

        if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            boolean isCodeReviewToTesting = task.getStatus() == com.neuroforge.enums.TaskStatus.CODE_REVIEW && request.getStatus() == com.neuroforge.enums.TaskStatus.TESTING;
            boolean isTestingToDone = task.getStatus() == com.neuroforge.enums.TaskStatus.TESTING && request.getStatus() == com.neuroforge.enums.TaskStatus.DONE;
            if (!isCodeReviewToTesting && !isTestingToDone) {
                throw new org.springframework.security.access.AccessDeniedException("QA Testers can only move tasks from Code Review to Testing or Testing to Done.");
            }
        }

        if (!isValidStatusTransition(task.getStatus(),
                request.getStatus())) {

            throw new InvalidRequestException(
                    "Invalid task status transition");
        }
        if (task.getStatus() == request.getStatus()) {
            throw new InvalidRequestException(
                    "Task is already in the selected status");
        }

        TaskStatus oldStatus = task.getStatus();

        task.setStatus(request.getStatus());

        taskRepository.save(task);
        if (task.getSprint() != null) {
            checkAndUpdateSprintStatus(task.getSprint());
        }

        TaskStatusHistory history = new TaskStatusHistory();

        history.setTask(task);
        history.setOldStatus(oldStatus);
        history.setNewStatus(request.getStatus());
        history.setChangedBy(user);

        taskStatusHistoryRepository.save(history);

        activityService.logActivity(task.getProject().getOrganization().getId(), 
                                    "Task Status Updated", 
                                    "Moved task '" + task.getTitle() + "' to " + request.getStatus(), 
                                    loggedInEmail);

        if (oldStatus == com.neuroforge.enums.TaskStatus.IN_PROGRESS && task.getStatus() == com.neuroforge.enums.TaskStatus.CODE_REVIEW) {
            List<User> qaTesters = task.getProject().getMembers().stream()
                    .filter(m -> m.getRole() == com.neuroforge.enums.ProjectRole.QA || m.getUser().getRole() == com.neuroforge.enums.Role.QA_TESTER)
                    .map(com.neuroforge.entity.ProjectMember::getUser)
                    .toList();
            for (User qa : qaTesters) {
                notificationService.createNotification(qa, "Ready for Code Review", "Task '" + task.getTitle() + "' has been moved to Code Review by " + user.getFullName() + ".", "TASK_READY_FOR_REVIEW", task.getId());
            }
        }

        if (task.getStatus() == com.neuroforge.enums.TaskStatus.DONE && user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            List<User> pms = task.getProject().getMembers().stream()
                    .filter(m -> m.getRole() == com.neuroforge.enums.ProjectRole.PROJECT_MANAGER || m.getUser().getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER)
                    .map(com.neuroforge.entity.ProjectMember::getUser)
                    .toList();
            for (User pm : pms) {
                notificationService.createNotification(pm, "Task Completed", "Task '" + task.getTitle() + "' has been moved to Done by QA Tester " + user.getFullName() + ".", "TASK_DONE", task.getId());
            }
        }

        TaskStatusUpdateEvent event = new TaskStatusUpdateEvent();

        event.setTaskId(task.getId());
        event.setTaskTitle(task.getTitle());

        event.setProjectId(task.getProject().getId());

        if (task.getSprint() != null) {
            event.setSprintId(task.getSprint().getId());
        }

        event.setOldStatus(oldStatus);
        event.setNewStatus(task.getStatus());

        event.setUpdatedById(user.getId());
        event.setUpdatedByName(user.getFullName());

        if (event.getSprintId() != null) {
            taskEventPublisher.publishTaskStatusUpdate(event);
        }

        Task updatedTask = taskRepository.findTaskById(taskId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        return mapToResponse(updatedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskStatusHistoryResponse> getTaskStatusHistory(
            Long taskId,
            String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        taskRepository.findTaskById(taskId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Task not found"));

        return taskStatusHistoryRepository
                .findByTaskIdOrderByChangedAtAsc(taskId)
                .stream()
                .map(this::mapToHistoryResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return taskRepository.findByAssigneeId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }


    private void checkAndUpdateSprintStatus(Sprint sprint) {
        if (sprint == null || sprint.getId() == null) return;
        List<Task> sprintTasks = taskRepository.findBySprintId(sprint.getId());
        if (sprintTasks.isEmpty()) {
            if (sprint.getStatus() == SprintStatus.COMPLETED) {
                sprint.setStatus(SprintStatus.PLANNED);
                sprintRepository.save(sprint);
            }
            return;
        }

        boolean allDone = sprintTasks.stream().allMatch(t -> t.getStatus() == TaskStatus.DONE);

        if (allDone) {
            if (sprint.getStatus() != SprintStatus.COMPLETED) {
                sprint.setStatus(SprintStatus.COMPLETED);
                sprintRepository.save(sprint);
            }
        } else {
            if (sprint.getStatus() == SprintStatus.COMPLETED) {
                sprint.setStatus(SprintStatus.ACTIVE);
                sprintRepository.save(sprint);
            }
        }
    }

}
