package com.neuroforge.service.impl;

import com.neuroforge.dto.bug.BugRequest;
import com.neuroforge.dto.bug.BugResponse;
import com.neuroforge.entity.*;
import com.neuroforge.enums.BugStatus;
import com.neuroforge.enums.Role;
import com.neuroforge.enums.TaskPriority;
import com.neuroforge.exception.InvalidRequestException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.*;
import com.neuroforge.service.BugService;
import com.neuroforge.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BugServiceImpl implements BugService {

    private final BugRepository bugRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public BugResponse createBug(BugRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getTaskId() == null) {
            throw new InvalidRequestException("Affected Task is required when reporting a bug.");
        }

        Task task = taskRepository.findTaskById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Selected task not found."));

        if (task.getAssignee() == null) {
            throw new InvalidRequestException("This task does not have a Developer assigned. Please assign a Developer to the task before reporting this bug.");
        }

        Project project = task.getProject();
        if (user.getRole() != Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
            throw new AccessDeniedException("User does not have access to this project.");
        }

        Bug bug = new Bug();
        bug.setTitle(request.getTitle() != null ? request.getTitle().trim() : "");
        bug.setDescription(request.getDescription());
        bug.setStatus(BugStatus.OPEN);
        bug.setPriority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM);
        bug.setSeverity(request.getSeverity() != null ? request.getSeverity() : TaskPriority.MEDIUM);
        
        bug.setProject(project);
        bug.setSprint(task.getSprint());
        bug.setTask(task);
        bug.setReporter(user);
        bug.setAssignee(task.getAssignee());

        bug.setStepsToReproduce(request.getStepsToReproduce());
        bug.setExpectedResult(request.getExpectedResult());
        bug.setActualResult(request.getActualResult());
        bug.setAttachmentUrl(request.getAttachmentUrl());

        Bug savedBug = bugRepository.save(bug);

        // Notify assigned Developer
        if (task.getAssignee() != null) {
            try {
                notificationService.createNotification(
                    task.getAssignee(),
                    "New Bug Assigned",
                    "Bug '" + savedBug.getTitle() + "' linked to task '" + task.getTitle() + "' was assigned to you.",
                    "BUG_ASSIGNED",
                    savedBug.getId()
                );
            } catch (Exception ignored) {
            }
        }

        return mapToResponse(savedBug);
    }

    @Override
    @Transactional
    public BugResponse updateBug(Long bugId, BugRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found"));

        BugStatus oldStatus = bug.getStatus();
        BugStatus newStatus = request.getStatus() != null ? request.getStatus() : oldStatus;

        // Role-based status transition restrictions
        if (user.getRole() == Role.DEVELOPER) {
            if (newStatus == BugStatus.CLOSED) {
                throw new AccessDeniedException("Developers cannot close bugs. Please mark the bug as READY_FOR_QA for QA retesting.");
            }
            if (newStatus == BugStatus.REOPENED) {
                throw new AccessDeniedException("Developers cannot reopen bugs.");
            }
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            bug.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            bug.setDescription(request.getDescription());
        }
        if (request.getPriority() != null) {
            bug.setPriority(request.getPriority());
        }
        if (request.getSeverity() != null) {
            bug.setSeverity(request.getSeverity());
        }
        if (request.getStepsToReproduce() != null) {
            bug.setStepsToReproduce(request.getStepsToReproduce());
        }
        if (request.getExpectedResult() != null) {
            bug.setExpectedResult(request.getExpectedResult());
        }
        if (request.getActualResult() != null) {
            bug.setActualResult(request.getActualResult());
        }
        if (request.getAttachmentUrl() != null) {
            bug.setAttachmentUrl(request.getAttachmentUrl());
        }
        if (request.getRetestComments() != null) {
            bug.setRetestComments(request.getRetestComments());
        }

        bug.setStatus(newStatus);
        Bug savedBug = bugRepository.save(bug);

        // Notifications on status change
        if (oldStatus != newStatus) {
            try {
                if (newStatus == BugStatus.READY_FOR_QA && bug.getReporter() != null) {
                    notificationService.createNotification(
                        bug.getReporter(),
                        "Bug Ready for Retest",
                        "Developer " + user.getFullName() + " marked bug '" + bug.getTitle() + "' as READY_FOR_QA.",
                        "BUG_READY_FOR_QA",
                        bug.getId()
                    );
                } else if (newStatus == BugStatus.REOPENED && bug.getAssignee() != null) {
                    notificationService.createNotification(
                        bug.getAssignee(),
                        "Bug Reopened",
                        "QA Tester " + user.getFullName() + " retested and reopened bug '" + bug.getTitle() + "'.",
                        "BUG_REOPENED",
                        bug.getId()
                    );
                } else if (newStatus == BugStatus.CLOSED && bug.getAssignee() != null) {
                    notificationService.createNotification(
                        bug.getAssignee(),
                        "Bug Verified & Closed",
                        "QA Tester " + user.getFullName() + " verified and closed bug '" + bug.getTitle() + "'.",
                        "BUG_CLOSED",
                        bug.getId()
                    );
                }
            } catch (Exception ignored) {
            }
        }

        return mapToResponse(savedBug);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BugResponse> getBugsByProject(Long projectId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() != Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
            throw new AccessDeniedException("User does not have access to this project.");
        }
        
        List<Bug> bugs = bugRepository.findByProjectId(projectId);
        return bugs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteBug(Long bugId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found"));

        if (user.getRole() != Role.QA_TESTER && user.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only QA Testers have permission to delete bugs.");
        }

        bugRepository.delete(bug);
    }

    private BugResponse mapToResponse(Bug bug) {
        BugResponse response = new BugResponse();
        response.setId(bug.getId());
        response.setTitle(bug.getTitle());
        response.setDescription(bug.getDescription());
        response.setStatus(bug.getStatus());
        response.setPriority(bug.getPriority());
        response.setSeverity(bug.getSeverity());
        
        if (bug.getProject() != null) {
            response.setProjectId(bug.getProject().getId());
            response.setProjectName(bug.getProject().getName());
        }
        
        if (bug.getSprint() != null) {
            response.setSprintId(bug.getSprint().getId());
            response.setSprintName(bug.getSprint().getName());
        }

        if (bug.getTask() != null) {
            response.setTaskId(bug.getTask().getId());
            response.setTaskTitle(bug.getTask().getTitle());
        }
        
        if (bug.getReporter() != null) {
            response.setReporterId(bug.getReporter().getId());
            response.setReporterName(bug.getReporter().getFullName());
        }
        
        if (bug.getAssignee() != null) {
            response.setAssigneeId(bug.getAssignee().getId());
            response.setAssigneeName(bug.getAssignee().getFullName());
        }

        response.setStepsToReproduce(bug.getStepsToReproduce());
        response.setExpectedResult(bug.getExpectedResult());
        response.setActualResult(bug.getActualResult());
        response.setAttachmentUrl(bug.getAttachmentUrl());
        response.setRetestComments(bug.getRetestComments());
        
        response.setCreatedAt(bug.getCreatedAt());
        response.setUpdatedAt(bug.getUpdatedAt());
        return response;
    }
}
