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
import jakarta.transaction.Transactional;
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
        response.setTechStack(project.getTechStack());

        List<ProjectMemberResponse> members = project.getMembers()
                .stream()
                .map(member -> {

                    ProjectMemberResponse dto = new ProjectMemberResponse();

                    dto.setId(member.getUser().getId());
                    dto.setFullName(member.getUser().getFullName());
                    dto.setEmail(member.getUser().getEmail());
                    dto.setProjectRole(member.getRole());

                    return dto;

                })
                .toList();

        response.setTeam(members);
        response.setTeamSize(members.size());

        // Temporary value until Task Management module is completed
        response.setProgressPercent(0);

        return response;
    }

    private ProjectMember createProjectMember(Project project, User user) {
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);
        member.setRole(ProjectRole.DEVELOPER);
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
            project.setTechStack(request.getTechStack());
        }
        // Save Project
        Project savedProject = projectRepository.save(project);

        // Save Team Members
        if (request.getTeamMemberIds() != null &&
                !request.getTeamMemberIds().isEmpty()) {

            for (Long userId : request.getTeamMemberIds()) {

                User user = userRepository.findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found with id : " + userId));


                ProjectMember member = createProjectMember(project, user);
                projectMemberRepository.save(member);
            }
        }
        // Build Response
        return mapToProjectResponse(savedProject);
    }

    @Override
    public List<ProjectResponse> getProjectsByOrganization(Long organizationId) {

        // Validate Organization
        organizationRepository.findById(organizationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Organization not found"));

        // Fetch Projects
        List<Project> projects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);

        // Convert Entity -> DTO
        return projects.stream()
                .map(this::mapToProjectResponse)
                .toList();
    }

    @Override
    public ProjectResponse getProject(Long projectId) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Project not found with id : " + projectId
                        ));

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
        if (request.getTeamMemberIds() != null &&
                !request.getTeamMemberIds().isEmpty()) {

            for (Long userId : request.getTeamMemberIds()) {

                User user = userRepository.findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found with id : " + userId));

                ProjectMember member = createProjectMember(project, user);
                project.getMembers().add(member);
            }
        }

        Project updatedProject = projectRepository.save(project);

        return mapToProjectResponse(updatedProject);
    }

}
