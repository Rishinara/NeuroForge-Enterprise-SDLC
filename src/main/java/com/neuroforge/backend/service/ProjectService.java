package com.neuroforge.backend.service;

import com.neuroforge.backend.dto.CreateProjectRequest;
import com.neuroforge.backend.dto.MilestoneRequest;
import com.neuroforge.backend.dto.ProjectResponse;
import com.neuroforge.backend.entity.*;
import com.neuroforge.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final ProjectHealthSnapshotRepository snapshotRepository;
    private final OrganizationRepository organizationRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          MilestoneRepository milestoneRepository,
                          ProjectHealthSnapshotRepository snapshotRepository,
                          OrganizationRepository organizationRepository,
                          TeamRepository teamRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.milestoneRepository = milestoneRepository;
        this.snapshotRepository = snapshotRepository;
        this.organizationRepository = organizationRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProjectResponse createProject(Long orgId, CreateProjectRequest request) {
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (!team.getOrganization().getId().equals(orgId)) {
            throw new RuntimeException("Team does not belong to this organization");
        }

        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setMethodology(request.getMethodology());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setTechStackTags(request.getTechStackTags() != null ? request.getTechStackTags() : new ArrayList<>());
        project.setOrganization(organization);
        project.setTeam(team);
        project.setCreatedAt(LocalDateTime.now());
        project.setHealthStatus("ON_TRACK");

        // Populate project members with users assigned to the selected team
        List<User> teamMembers = userRepository.findByTeamId(team.getId());
        project.setMembers(teamMembers);

        // Add milestones if provided in the request
        if (request.getMilestones() != null && !request.getMilestones().isEmpty()) {
            List<Milestone> milestones = request.getMilestones().stream()
                    .map(mRequest -> new Milestone(mRequest.getName(), mRequest.getDueDate(), project))
                    .collect(Collectors.toList());
            project.setMilestones(milestones);
        }

        Project savedProject = projectRepository.save(project);

        // Calculate initial health status and write snapshot
        recalculateProjectHealth(savedProject);

        return new ProjectResponse(savedProject);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByOrg(Long orgId, User currentUser) {
        // Enforce access control
        // Org Admins and Project Managers can view all projects in the organization.
        // Developers and QA testers can only view projects they are assigned to as members.
        if (currentUser.getRole() == Role.SUPER_ADMIN || currentUser.getRole() == Role.ORG_ADMIN || currentUser.getRole() == Role.PROJECT_MANAGER) {
            return projectRepository.findByOrganizationId(orgId).stream()
                    .map(ProjectResponse::new)
                    .collect(Collectors.toList());
        } else {
            return projectRepository.findByOrganizationIdAndMemberId(orgId, currentUser.getId()).stream()
                    .map(ProjectResponse::new)
                    .collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectDetails(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        return new ProjectResponse(project);
    }

    @Transactional
    public ProjectResponse toggleMilestone(Long projectId, Long milestoneId, boolean completed) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!milestone.getProject().getId().equals(projectId)) {
            throw new RuntimeException("Milestone does not belong to the specified project");
        }

        milestone.setCompleted(completed);
        milestoneRepository.save(milestone);

        // Trigger health status recalculation immediately
        recalculateProjectHealth(project);

        return new ProjectResponse(project);
    }

    @Transactional
    public void recalculateProjectHealth(Project project) {
        List<Milestone> milestones = project.getMilestones();
        if (milestones == null || milestones.isEmpty()) {
            project.setHealthStatus("ON_TRACK");
            projectRepository.save(project);
            ProjectHealthSnapshot snapshot = new ProjectHealthSnapshot(project, 0.0, 0.0, "ON_TRACK");
            snapshotRepository.save(snapshot);
            return;
        }

        double tasksDonePercentage = 0.0;
        long completedCount = milestones.stream().filter(Milestone::isCompleted).count();
        tasksDonePercentage = ((double) completedCount / milestones.size()) * 100.0;

        double timelineElapsedPercentage = 0.0;
        LocalDate start = project.getStartDate();
        LocalDate end = project.getEndDate();
        LocalDate today = LocalDate.now();

        if (start != null && end != null) {
            long totalDays = ChronoUnit.DAYS.between(start, end);
            if (totalDays > 0) {
                if (today.isBefore(start)) {
                    timelineElapsedPercentage = 0.0;
                } else if (today.isAfter(end)) {
                    timelineElapsedPercentage = 100.0;
                } else {
                    long elapsedDays = ChronoUnit.DAYS.between(start, today);
                    timelineElapsedPercentage = ((double) elapsedDays / totalDays) * 100.0;
                }
            } else {
                timelineElapsedPercentage = 100.0;
            }
        }

        // Calculate health status
        String healthStatus;
        if (tasksDonePercentage >= timelineElapsedPercentage) {
            healthStatus = "ON_TRACK";
        } else if (tasksDonePercentage >= (timelineElapsedPercentage - 15.0)) {
            healthStatus = "AT_RISK";
        } else {
            healthStatus = "DELAYED";
        }

        project.setHealthStatus(healthStatus);
        projectRepository.save(project);

        // Save a historical health snapshot log
        ProjectHealthSnapshot snapshot = new ProjectHealthSnapshot(project, tasksDonePercentage, timelineElapsedPercentage, healthStatus);
        snapshotRepository.save(snapshot);
    }

    @Transactional(readOnly = true)
    public List<ProjectHealthSnapshot> getProjectHealthHistory(Long projectId) {
        // Ensure project exists
        if (!projectRepository.existsById(projectId)) {
            throw new RuntimeException("Project not found");
        }
        return snapshotRepository.findByProjectIdOrderByCalculatedAtDesc(projectId);
    }
}
