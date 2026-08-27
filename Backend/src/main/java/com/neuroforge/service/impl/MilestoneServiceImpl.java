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

    @Override
    @Transactional
    public MilestoneResponse createMilestone(MilestoneRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
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
        milestone.setStatus(request.getStatus());
        milestone.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        milestone.setActualDeliveryDate(request.getActualDeliveryDate());
        milestone.setProject(project);

        Milestone savedMilestone = milestoneRepository.save(milestone);
        return mapToResponse(savedMilestone);
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

        Milestone savedMilestone = milestoneRepository.save(milestone);
        return mapToResponse(savedMilestone);
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

        milestoneRepository.delete(milestone);
    }

    private MilestoneResponse mapToResponse(Milestone milestone) {
        MilestoneResponse response = new MilestoneResponse();
        response.setId(milestone.getId());
        response.setTitle(milestone.getTitle());
        response.setDescription(milestone.getDescription());
        response.setStatus(milestone.getStatus());
        response.setExpectedDeliveryDate(milestone.getExpectedDeliveryDate());
        response.setActualDeliveryDate(milestone.getActualDeliveryDate());
        
        if (milestone.getProject() != null) {
            response.setProjectId(milestone.getProject().getId());
            response.setProjectName(milestone.getProject().getName());
        }
        
        response.setCreatedAt(milestone.getCreatedAt());
        response.setUpdatedAt(milestone.getUpdatedAt());
        return response;
    }
}
