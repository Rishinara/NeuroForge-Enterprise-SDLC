package com.neuroforge.service.impl;

import com.neuroforge.dto.project.CreateProjectRequest;
import com.neuroforge.dto.project.ProjectMemberResponse;
import com.neuroforge.dto.project.ProjectResponse;
import com.neuroforge.dto.project.UpdateProjectRequest;
import com.neuroforge.entity.*;
import com.neuroforge.enums.HealthStatus;
import com.neuroforge.enums.ProjectRole;
import com.neuroforge.enums.ProjectStatus;
import com.neuroforge.exception.DuplicateResourceException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.OrganizationRepository;
import com.neuroforge.repository.ProjectMemberRepository;
import com.neuroforge.repository.ProjectRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.service.ProjectService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional

public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final com.neuroforge.repository.TeamRepository teamRepository;
    private final com.neuroforge.service.ActivityService activityService;
    private final com.neuroforge.repository.SpecRepository specRepository;

    private ProjectResponse mapToProjectResponse(Project project) {

        ProjectResponse response = new ProjectResponse();

        response.setId(project.getId());
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        response.setMethodology(project.getMethodology());
        response.setStatus(project.getStatus());
        response.setHealth(project.getHealth());
        response.setStartDate(project.getStartDate());
        response.setEndDate(project.getEndDate());
        response.setTechStack(project.getTechStack() != null ? new java.util.ArrayList<>(project.getTechStack()) : new java.util.ArrayList<>());

        List<ProjectMemberResponse> members = (project.getMembers() != null ? project.getMembers() : new java.util.HashSet<ProjectMember>())
                .stream()
                .filter(m -> m != null && m.getUser() != null)
                .map(member -> {

                    ProjectMemberResponse dto = new ProjectMemberResponse();

                    dto.setId(member.getUser().getId());
                    dto.setFullName(member.getUser().getFullName());
                    dto.setEmail(member.getUser().getEmail());
                    
                    if (member.getRole().isDeveloper()) {
                        if (member.getUser().getRole() == com.neuroforge.enums.Role.ORG_ADMIN) {
                            dto.setProjectRole(ProjectRole.ORG_ADMIN);
                        } else if (member.getUser().getRole() == com.neuroforge.enums.Role.SUPER_ADMIN) {
                            dto.setProjectRole(ProjectRole.SUPER_ADMIN);
                        } else if (member.getUser().getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER) {
                            dto.setProjectRole(ProjectRole.PROJECT_MANAGER);
                        } else if (member.getUser().getRole() == com.neuroforge.enums.Role.QA_TESTER) {
                            dto.setProjectRole(ProjectRole.QA);
                        } else if (member.getUser().getRole() == com.neuroforge.enums.Role.CLIENT) {
                            dto.setProjectRole(ProjectRole.CLIENT);
                        } else {
                            dto.setProjectRole(member.getRole());
                        }
                    } else {
                        dto.setProjectRole(member.getRole());
                    }

                    return dto;

                })
                .toList();

        response.setTeam(members);
        response.setTeamSize(members.size());

        if (project.getAssignedTeams() != null) {
            List<com.neuroforge.dto.organization.TeamResponse> teamResponses = project.getAssignedTeams().stream()
                    .map(t -> new com.neuroforge.dto.organization.TeamResponse(t.getId(), t.getName(), 0)) // Just basic info
                    .toList();
            response.setAssignedTeams(teamResponses);
        } else {
            response.setAssignedTeams(new java.util.ArrayList<>());
        }

        int totalTasks = 0;
        int completedTasks = 0;
        if (project.getTasks() != null) {
            for (com.neuroforge.entity.Task task : project.getTasks()) {
                totalTasks++;
                if (task.getStatus() != null && task.getStatus().name().equalsIgnoreCase("DONE")) {
                    completedTasks++;
                }
            }
        }
        double taskCompletionPercentage = totalTasks == 0 ? 0 : ((double) completedTasks / totalTasks) * 100;
        response.setProgressPercent((int) Math.round(taskCompletionPercentage));

        return response;
    }

    private ProjectMember createProjectMember(Project project, User user) {
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        
        if (user.getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER) {
            member.setRole(ProjectRole.PROJECT_MANAGER);
        } else if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            member.setRole(ProjectRole.QA);
        } else if (user.getRole() == com.neuroforge.enums.Role.CLIENT) {
            member.setRole(ProjectRole.CLIENT);
        } else if (user.getRole() == com.neuroforge.enums.Role.ORG_ADMIN) {
            member.setRole(ProjectRole.ORG_ADMIN);
        } else if (user.getRole() == com.neuroforge.enums.Role.SUPER_ADMIN) {
            member.setRole(ProjectRole.SUPER_ADMIN);
        } else {
            member.setRole(ProjectRole.DEVELOPER);
        }
        
        member.setActive(true);
        member.setJoinedDate(LocalDate.now());
        return member;
    }

    @Override
    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {

        // Check duplicate project name
        if (projectRepository.existsByOrganizationIdAndNameIgnoreCase(
                request.getOrgId(), request.getName())) {

            throw new DuplicateResourceException(
                    "Project already exists in this organization."
            );
        }
        // Validate Organization
        Organization organization = organizationRepository.findById(request.getOrgId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Organization not found"));
        // Create Project
        Project project = new Project();

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setMethodology(request.getMethodology());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());

        // Default values
        project.setStatus(ProjectStatus.PLANNING);
        project.setHealth(HealthStatus.ON_TRACK);

        project.setOrganization(organization);

        // Tech Stack
        if (request.getTechStack() != null) {
            project.setTechStack(new java.util.HashSet<>(request.getTechStack()));
        }
        // Save Project
        // Add Team Members
        if (request.getTeamMemberIds() != null && !request.getTeamMemberIds().isEmpty()) {
            for (Long userId : request.getTeamMemberIds()) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with id : " + userId));
                if (user.getOrganization() == null || !user.getOrganization().getId().equals(request.getOrgId())) {
                    throw new com.neuroforge.exception.InvalidRequestException("User " + user.getEmail() + " does not belong to the organization.");
                }
                if (projectMemberRepository.countByUserId(userId) >= 2) {
                    continue;
                }
                ProjectMember member = createProjectMember(project, user);
                project.getMembers().add(member);
            }
        }
        
        // Add Assigned Teams
        if (request.getAssignedTeamIds() != null && !request.getAssignedTeamIds().isEmpty()) {
            for (Long teamId : request.getAssignedTeamIds()) {
                Team team = teamRepository.findById(teamId)
                        .orElseThrow(() -> new ResourceNotFoundException("Team not found with id : " + teamId));
                if (!team.getOrganization().getId().equals(request.getOrgId())) {
                    throw new com.neuroforge.exception.InvalidRequestException("Team does not belong to the organization.");
                }
                project.getAssignedTeams().add(team);
            }
        }

        // Automatically add Project Manager to project members if they created it
        String actorEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User actor = userRepository.findByEmail(actorEmail).orElse(null);
        if (actor != null && actor.getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER) {
            boolean alreadyAdded = project.getMembers().stream()
                    .anyMatch(m -> m.getUser().getId().equals(actor.getId()));
            if (!alreadyAdded) {
                ProjectMember pmMember = createProjectMember(project, actor);
                project.getMembers().add(pmMember);
            }
        }

        // Save Project (and cascade members)
        Project savedProject = projectRepository.save(project);
        // Build Response
        
        // Log Activity
        activityService.logActivity(organization.getId(), "Project created", "Created project: " + savedProject.getName(), actorEmail);
        
        return mapToProjectResponse(savedProject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByOrganization(Long organizationId, String loggedInEmail) {

        // Validate Organization
        organizationRepository.findById(organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Organization not found"));

        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Fetch Projects
        List<Project> projects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);

        if (user.getRole() == com.neuroforge.enums.Role.CLIENT 
                || user.getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER
                || user.getRole().isDeveloper()
                || user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            projects = projects.stream()
                    .filter(p -> p != null && p.getMembers() != null && p.getMembers().stream()
                            .anyMatch(m -> m != null && m.getUser() != null && user.getId().equals(m.getUser().getId())))
                    .toList();
        }

        // Convert Entity -> DTO
        return projects.stream()
                .map(this::mapToProjectResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long projectId) {
        String loggedInEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Project not found with id : " + projectId
                        ));

        if (user.getRole() == com.neuroforge.enums.Role.CLIENT 
                || user.getRole().isDeveloper()
                || user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            
            boolean isMember = project.getMembers() != null && project.getMembers().stream()
                    .anyMatch(m -> m != null && m.getUser() != null && user.getId().equals(m.getUser().getId()));
            
            if (!isMember) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to view this project");
            }
        }

        return mapToProjectResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long projectId,
                                         UpdateProjectRequest request) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Project not found with id : " + projectId));

        // Update basic fields
        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getMethodology() != null) {
            project.setMethodology(request.getMethodology());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getHealth() != null) {
            project.setHealth(request.getHealth());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getHealth() != null) {
            project.setHealth(request.getHealth());
        }
        // Update Tech Stack
        project.getTechStack().clear();
        if (request.getTechStack() != null) {
            project.getTechStack().addAll(request.getTechStack());
        }

        // Remove old members
        projectMemberRepository.deleteByProjectId(projectId);
        project.getMembers().clear();

        // Add new members
        if (request.getTeamMemberIds() != null && !request.getTeamMemberIds().isEmpty()) {
            for (Long userId : request.getTeamMemberIds()) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with id : " + userId));
                if (user.getOrganization() == null || !user.getOrganization().getId().equals(project.getOrganization().getId())) {
                    throw new com.neuroforge.exception.InvalidRequestException("User " + user.getEmail() + " does not belong to the organization.");
                }
                if (projectMemberRepository.existsByUserIdAndProjectIdNot(userId, projectId)) {
                    throw new com.neuroforge.exception.InvalidRequestException("User " + (user.getFullName() != null ? user.getFullName() : user.getEmail()) + " is already assigned to another project.");
                }
                ProjectMember member = createProjectMember(project, user);
                project.getMembers().add(member);
            }
        }

        // Update Assigned Teams
        if (project.getAssignedTeams() != null) {
            project.getAssignedTeams().clear();
        } else {
            project.setAssignedTeams(new java.util.HashSet<>());
        }
        if (request.getAssignedTeamIds() != null && !request.getAssignedTeamIds().isEmpty()) {
            for (Long teamId : request.getAssignedTeamIds()) {
                Team team = teamRepository.findById(teamId)
                        .orElseThrow(() -> new ResourceNotFoundException("Team not found with id : " + teamId));
                if (!team.getOrganization().getId().equals(project.getOrganization().getId())) {
                    throw new com.neuroforge.exception.InvalidRequestException("Team does not belong to the organization.");
                }
                project.getAssignedTeams().add(team);
            }
        }

        Project updatedProject = projectRepository.save(project);
        
        String actorEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        activityService.logActivity(updatedProject.getOrganization().getId(), "Project updated", "Updated project: " + updatedProject.getName(), actorEmail);

        return mapToProjectResponse(updatedProject);
    }

    @Override
    @Transactional
    public void deleteProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id : " + projectId));
                
        if (specRepository.existsByProjectId(projectId)) {
            throw new com.neuroforge.exception.InvalidRequestException("Cannot delete project because it has associated specs. Please delete or reassign them first.");
        }
        
        Long orgId = project.getOrganization().getId();
        String projectName = project.getName();
        
        projectRepository.delete(project);
        
        String actorEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        activityService.logActivity(orgId, "Project deleted", "Deleted project: " + projectName, actorEmail);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.neuroforge.dto.project.ProjectProgressResponse getProjectProgress(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id : " + projectId));

        int totalTasks = 0;
        int completedTasks = 0;
        int totalStoryPoints = 0;
        int completedStoryPoints = 0;

        for (com.neuroforge.entity.Task task : project.getTasks()) {
            totalTasks++;
            int points = task.getStoryPoints() != null ? task.getStoryPoints() : 0;
            totalStoryPoints += points;

            if (task.getStatus() != null && task.getStatus().name().equalsIgnoreCase("DONE")) {
                completedTasks++;
                completedStoryPoints += points;
            }
        }

        double taskCompletionPercentage = totalTasks == 0 ? 0 : ((double) completedTasks / totalTasks) * 100;
        double pointCompletionPercentage = totalStoryPoints == 0 ? 0 : ((double) completedStoryPoints / totalStoryPoints) * 100;

        return com.neuroforge.dto.project.ProjectProgressResponse.builder()
                .projectId(project.getId())
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .totalStoryPoints(totalStoryPoints)
                .completedStoryPoints(completedStoryPoints)
                .taskCompletionPercentage(Math.round(taskCompletionPercentage * 100.0) / 100.0)
                .pointCompletionPercentage(Math.round(pointCompletionPercentage * 100.0) / 100.0)
                .build();
    }

    @Override
    @Transactional
    public void updateProjectMemberRole(Long projectId, Long userId, ProjectRole newRole) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id : " + projectId));

        ProjectMember memberToUpdate = project.getMembers().stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of this project"));

        memberToUpdate.setRole(newRole);
        projectRepository.save(project);
        
        String actorEmail = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        activityService.logActivity(project.getOrganization().getId(), "Project member role updated", "Updated role for user ID " + userId + " to " + newRole, actorEmail);
    }
}
