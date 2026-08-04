package com.neuroforge.service.impl;

import com.neuroforge.dto.bug.BugRequest;
import com.neuroforge.dto.bug.BugResponse;
import com.neuroforge.entity.Bug;
import com.neuroforge.entity.Project;
import com.neuroforge.entity.Sprint;
import com.neuroforge.entity.User;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.BugRepository;
import com.neuroforge.repository.ProjectRepository;
import com.neuroforge.repository.SprintRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.service.BugService;
import lombok.RequiredArgsConstructor;
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

    @Override
    @Transactional
    public BugResponse createBug(BugRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }

        Sprint sprint = null;
        if (request.getSprintId() != null) {
            sprint = sprintRepository.findSprintById(request.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));
        }

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
        }

        Bug bug = new Bug();
        bug.setTitle(request.getTitle());
        bug.setDescription(request.getDescription());
        bug.setStatus(request.getStatus());
        bug.setPriority(request.getPriority());
        bug.setProject(project);
        bug.setSprint(sprint);
        bug.setReporter(user);
        bug.setAssignee(assignee);

        Bug savedBug = bugRepository.save(bug);
        return mapToResponse(savedBug);
    }

    @Override
    @Transactional
    public BugResponse updateBug(Long bugId, BugRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found"));

        if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            if (bug.getAssignee() == null || !bug.getAssignee().getId().equals(user.getId())) {
                if (!bug.getReporter().getId().equals(user.getId())) {
                    throw new org.springframework.security.access.AccessDeniedException("QA Testers can only update bugs they reported or are assigned to.");
                }
            }
        }

        Sprint sprint = null;
        if (request.getSprintId() != null) {
            sprint = sprintRepository.findSprintById(request.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));
        }

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
        }

        bug.setTitle(request.getTitle());
        bug.setDescription(request.getDescription());
        bug.setStatus(request.getStatus());
        bug.setPriority(request.getPriority());
        bug.setSprint(sprint);
        bug.setAssignee(assignee);

        Bug savedBug = bugRepository.save(bug);
        return mapToResponse(savedBug);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BugResponse> getBugsByProject(Long projectId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }
        
        List<Bug> bugs = bugRepository.findByProjectId(projectId);
        
        if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            bugs = bugs.stream()
                .filter(b -> (b.getAssignee() != null && b.getAssignee().getId().equals(user.getId())) || 
                             (b.getReporter().getId().equals(user.getId())))
                .collect(Collectors.toList());
        }

        return bugs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteBug(Long bugId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found"));

        if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            if (!bug.getReporter().getId().equals(user.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("QA Testers can only delete bugs they reported.");
            }
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
        
        if (bug.getProject() != null) {
            response.setProjectId(bug.getProject().getId());
            response.setProjectName(bug.getProject().getName());
        }
        
        if (bug.getSprint() != null) {
            response.setSprintId(bug.getSprint().getId());
            response.setSprintName(bug.getSprint().getName());
        }
        
        if (bug.getReporter() != null) {
            response.setReporterId(bug.getReporter().getId());
            response.setReporterName(bug.getReporter().getFullName());
        }
        
        if (bug.getAssignee() != null) {
            response.setAssigneeId(bug.getAssignee().getId());
            response.setAssigneeName(bug.getAssignee().getFullName());
        }
        
        response.setCreatedAt(bug.getCreatedAt());
        response.setUpdatedAt(bug.getUpdatedAt());
        return response;
    }
}
