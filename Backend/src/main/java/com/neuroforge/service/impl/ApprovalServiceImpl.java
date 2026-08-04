package com.neuroforge.service.impl;

import com.neuroforge.dto.approval.ApprovalRequest;
import com.neuroforge.dto.approval.ApprovalResponse;
import com.neuroforge.entity.Approval;
import com.neuroforge.entity.Project;
import com.neuroforge.entity.User;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.ApprovalRepository;
import com.neuroforge.repository.ProjectRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApprovalServiceImpl implements ApprovalService {

    private final ApprovalRepository approvalRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ApprovalResponse createApproval(ApprovalRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }

        if (user.getRole() != com.neuroforge.enums.Role.CLIENT && user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && user.getRole() != com.neuroforge.enums.Role.PROJECT_MANAGER) {
             throw new org.springframework.security.access.AccessDeniedException("Only clients or managers can register approvals.");
        }

        Approval approval = new Approval();
        approval.setEntityType(request.getEntityType());
        approval.setEntityId(request.getEntityId());
        approval.setStatus(request.getStatus());
        approval.setComments(request.getComments());
        approval.setClient(user);
        approval.setProject(project);

        Approval savedApproval = approvalRepository.save(approval);
        return mapToResponse(savedApproval);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalResponse> getApprovalsByProject(Long projectId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }

        if (user.getRole() == com.neuroforge.enums.Role.CLIENT 
                || user.getRole() == com.neuroforge.enums.Role.DEVELOPER
                || user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            boolean isMember = project.getMembers().stream()
                    .anyMatch(m -> m.getUser().getId().equals(user.getId()));
            if (!isMember) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to view this project");
            }
        }

        List<Approval> approvals = approvalRepository.findByProjectId(projectId);
        return approvals.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private ApprovalResponse mapToResponse(Approval approval) {
        ApprovalResponse response = new ApprovalResponse();
        response.setId(approval.getId());
        response.setEntityType(approval.getEntityType());
        response.setEntityId(approval.getEntityId());
        response.setStatus(approval.getStatus());
        response.setComments(approval.getComments());
        
        if (approval.getClient() != null) {
            response.setClientId(approval.getClient().getId());
            response.setClientName(approval.getClient().getFullName());
        }
        
        if (approval.getProject() != null) {
            response.setProjectId(approval.getProject().getId());
            response.setProjectName(approval.getProject().getName());
        }
        
        response.setCreatedAt(approval.getCreatedAt());
        response.setUpdatedAt(approval.getUpdatedAt());
        return response;
    }
}
