package com.neuroforge.service.impl;

import com.neuroforge.dto.milestone.MilestoneRequest;
import com.neuroforge.dto.milestone.MilestoneResponse;
import com.neuroforge.entity.Milestone;
import com.neuroforge.entity.Project;
import com.neuroforge.entity.User;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.MilestoneRepository;
import com.neuroforge.repository.ProjectRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.service.MilestoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MilestoneServiceImpl implements MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final com.neuroforge.repository.SprintRepository sprintRepository;

    @Override
    @Transactional
    public MilestoneResponse createMilestone(MilestoneRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() == com.neuroforge.enums.Role.ORG_ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Organization Admins do not have permission to add milestones");
        }

        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }

        if (request.getExpectedDeliveryDate() != null) {
            if (project.getStartDate() != null && request.getExpectedDeliveryDate().isBefore(project.getStartDate())) {
                throw new com.neuroforge.exception.InvalidRequestException("Milestone expected delivery date cannot be before project start date (" + project.getStartDate() + ")");
            }
            if (project.getEndDate() != null && request.getExpectedDeliveryDate().isAfter(project.getEndDate())) {
                throw new com.neuroforge.exception.InvalidRequestException("Milestone expected delivery date cannot be after project deadline (" + project.getEndDate() + ")");
            }
        }

        Milestone milestone = new Milestone();
        milestone.setTitle(request.getTitle());
        milestone.setDescription(request.getDescription());
        milestone.setStatus(request.getStatus() != null ? request.getStatus() : com.neuroforge.enums.MilestoneStatus.PENDING);
        milestone.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        milestone.setActualDeliveryDate(request.getActualDeliveryDate());
        milestone.setTotalSprints(request.getTotalSprints() != null && request.getTotalSprints() > 0 ? request.getTotalSprints() : 1);
        milestone.setCompletedSprints(0);
        milestone.setProject(project);

        Milestone savedMilestone = milestoneRepository.save(milestone);
        evaluateProjectMilestonesAndHealth(project.getId());
        Milestone reloaded = milestoneRepository.findById(savedMilestone.getId()).orElse(savedMilestone);
        return mapToResponse(reloaded);
    }

    @Override
    @Transactional
    public MilestoneResponse updateMilestone(Long milestoneId, MilestoneRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));

        Project project = milestone.getProject();
        if (project != null && request.getExpectedDeliveryDate() != null) {
            if (project.getStartDate() != null && request.getExpectedDeliveryDate().isBefore(project.getStartDate())) {
                throw new com.neuroforge.exception.InvalidRequestException("Milestone expected delivery date cannot be before project start date (" + project.getStartDate() + ")");
            }
            if (project.getEndDate() != null && request.getExpectedDeliveryDate().isAfter(project.getEndDate())) {
                throw new com.neuroforge.exception.InvalidRequestException("Milestone expected delivery date cannot be after project deadline (" + project.getEndDate() + ")");
            }
        }

        milestone.setTitle(request.getTitle());
        milestone.setDescription(request.getDescription());
        milestone.setStatus(request.getStatus());
        milestone.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        milestone.setActualDeliveryDate(request.getActualDeliveryDate());
        if (request.getTotalSprints() != null && request.getTotalSprints() > 0) {
            milestone.setTotalSprints(request.getTotalSprints());
        }

        Milestone savedMilestone = milestoneRepository.save(milestone);
        evaluateProjectMilestonesAndHealth(project != null ? project.getId() : null);
        Milestone reloaded = milestoneRepository.findById(savedMilestone.getId()).orElse(savedMilestone);
        return mapToResponse(reloaded);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MilestoneResponse> getMilestonesByProject(Long projectId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }

        if (user.getRole() == com.neuroforge.enums.Role.CLIENT 
                || user.getRole().isDeveloper()
                || user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            boolean isMember = project.getMembers().stream()
                    .anyMatch(m -> m.getUser().getId().equals(user.getId()));
            if (!isMember) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to view this project");
            }
        }

        List<Milestone> milestones = milestoneRepository.findByProjectId(projectId);
        return milestones.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteMilestone(Long milestoneId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));

        Long projectId = milestone.getProject() != null ? milestone.getProject().getId() : null;
        milestoneRepository.delete(milestone);
        if (projectId != null) {
            evaluateProjectMilestonesAndHealth(projectId);
        }
    }

    @Override
    @Transactional
    public void evaluateProjectMilestonesAndHealth(Long projectId) {
        if (projectId == null) return;
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return;

        List<Milestone> milestones = milestoneRepository.findByProjectId(projectId);
        if (milestones.isEmpty()) return;

        // Sort milestones by expectedDeliveryDate, then createdAt, then ID
        milestones.sort((m1, m2) -> {
            if (m1.getExpectedDeliveryDate() != null && m2.getExpectedDeliveryDate() != null) {
                int cmp = m1.getExpectedDeliveryDate().compareTo(m2.getExpectedDeliveryDate());
                if (cmp != 0) return cmp;
            }
            if (m1.getCreatedAt() != null && m2.getCreatedAt() != null) {
                return m1.getCreatedAt().compareTo(m2.getCreatedAt());
            }
            return Long.compare(m1.getId() != null ? m1.getId() : 0L, m2.getId() != null ? m2.getId() : 0L);
        });

        List<com.neuroforge.entity.Sprint> allSprints = sprintRepository.findAllByProjectId(projectId);

        boolean hasExplicitLinks = allSprints.stream().anyMatch(s -> s.getMilestone() != null);

        if (hasExplicitLinks) {
            for (Milestone m : milestones) {
                int totalRequired = (m.getTotalSprints() != null && m.getTotalSprints() > 0) ? m.getTotalSprints() : 1;
                long completed = allSprints.stream()
                        .filter(s -> s.getMilestone() != null && s.getMilestone().getId().equals(m.getId()) && s.getStatus() == com.neuroforge.enums.SprintStatus.COMPLETED)
                        .count();
                m.setCompletedSprints((int) completed);
                if (completed >= totalRequired) {
                    m.setStatus(com.neuroforge.enums.MilestoneStatus.COMPLETED);
                    if (m.getActualDeliveryDate() == null) {
                        m.setActualDeliveryDate(java.time.LocalDate.now());
                    }
                } else {
                    if (m.getStatus() == com.neuroforge.enums.MilestoneStatus.COMPLETED) {
                        m.setStatus(completed > 0 ? com.neuroforge.enums.MilestoneStatus.IN_PROGRESS : com.neuroforge.enums.MilestoneStatus.PENDING);
                        m.setActualDeliveryDate(null);
                    }
                }
                milestoneRepository.save(m);
            }
        } else {
            // Allocate completed sprints sequentially across project milestones
            long totalCompletedSprints = allSprints.stream()
                    .filter(s -> s.getStatus() == com.neuroforge.enums.SprintStatus.COMPLETED)
                    .count();
            long pool = totalCompletedSprints;

            for (Milestone m : milestones) {
                int totalRequired = (m.getTotalSprints() != null && m.getTotalSprints() > 0) ? m.getTotalSprints() : 1;
                int allocated = (int) Math.min(pool, (long) totalRequired);
                pool = Math.max(0, pool - allocated);

                m.setCompletedSprints(allocated);
                if (allocated >= totalRequired) {
                    m.setStatus(com.neuroforge.enums.MilestoneStatus.COMPLETED);
                    if (m.getActualDeliveryDate() == null) {
                        m.setActualDeliveryDate(java.time.LocalDate.now());
                    }
                } else {
                    if (m.getStatus() == com.neuroforge.enums.MilestoneStatus.COMPLETED) {
                        m.setStatus(allocated > 0 ? com.neuroforge.enums.MilestoneStatus.IN_PROGRESS : com.neuroforge.enums.MilestoneStatus.PENDING);
                        m.setActualDeliveryDate(null);
                    }
                }
                milestoneRepository.save(m);
            }
        }

        // Check if all project milestones are completed (no other pending milestone exists)
        boolean allMilestonesCompleted = milestones.stream().allMatch(m ->
                m.getStatus() == com.neuroforge.enums.MilestoneStatus.COMPLETED || m.getStatus() == com.neuroforge.enums.MilestoneStatus.ACHIEVED
        );

        if (allMilestonesCompleted) {
            project.setHealth(com.neuroforge.enums.HealthStatus.COMPLETED);
            project.setStatus(com.neuroforge.enums.ProjectStatus.COMPLETED);
            projectRepository.save(project);
        } else {
            if (project.getHealth() == com.neuroforge.enums.HealthStatus.COMPLETED) {
                project.setHealth(com.neuroforge.enums.HealthStatus.ON_TRACK);
                project.setStatus(com.neuroforge.enums.ProjectStatus.ACTIVE);
                projectRepository.save(project);
            }
        }
    }

    private MilestoneResponse mapToResponse(Milestone milestone) {
        MilestoneResponse response = new MilestoneResponse();
        response.setId(milestone.getId());
        response.setTitle(milestone.getTitle());
        response.setDescription(milestone.getDescription());
        response.setStatus(milestone.getStatus());
        response.setExpectedDeliveryDate(milestone.getExpectedDeliveryDate());
        response.setActualDeliveryDate(milestone.getActualDeliveryDate());
        response.setTotalSprints(milestone.getTotalSprints() != null ? milestone.getTotalSprints() : 1);
        response.setCompletedSprints(milestone.getCompletedSprints() != null ? milestone.getCompletedSprints() : 0);
        
        if (milestone.getProject() != null) {
            response.setProjectId(milestone.getProject().getId());
            response.setProjectName(milestone.getProject().getName());
        }
        
        response.setCreatedAt(milestone.getCreatedAt());
        response.setUpdatedAt(milestone.getUpdatedAt());
        return response;
    }
}
