package com.neuroforge.service.impl;



import com.neuroforge.dto.approval.ApprovalActionRequest;

import com.neuroforge.dto.approval.ApprovalRequest;

import com.neuroforge.dto.approval.ApprovalResponse;

import com.neuroforge.entity.Approval;

import com.neuroforge.entity.Project;

import com.neuroforge.entity.User;

import com.neuroforge.enums.ApprovalEntityType;

import com.neuroforge.enums.ApprovalStatus;

import com.neuroforge.enums.Role;

import com.neuroforge.exception.ResourceNotFoundException;

import com.neuroforge.repository.ApprovalRepository;

import com.neuroforge.repository.ProjectRepository;

import com.neuroforge.repository.UserRepository;

import com.neuroforge.service.ApprovalService;

import com.neuroforge.service.AuditLogService;

import com.neuroforge.service.NotificationService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;

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

    private final AuditLogService auditLogService;

    private final NotificationService notificationService;



    @Override

    @Transactional

    public ApprovalResponse createApproval(ApprovalRequest request, String loggedInEmail) {

        User user = userRepository.findByEmail(loggedInEmail)

                .orElseThrow(() -> new ResourceNotFoundException("User not found"));



        Project project = projectRepository.findById(request.getProjectId())

                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));



        if (user.getRole() != Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {

            throw new AccessDeniedException("User does not have access to this project");

        }



        Approval approval = new Approval();

        approval.setEntityType(request.getEntityType() != null ? request.getEntityType() : ApprovalEntityType.GENERAL);

        approval.setEntityId(request.getEntityId());

        approval.setTitle(request.getTitle() != null && !request.getTitle().isBlank() 

                ? request.getTitle() 

                : (request.getEntityType() != null ? request.getEntityType().name() + " Approval Request" : "General Approval Request"));

        approval.setStatus(request.getStatus() != null ? request.getStatus() : ApprovalStatus.PENDING);

        approval.setComments(request.getComments());

        approval.setAttachmentUrl(request.getAttachmentUrl());

        approval.setRequestedBy(user);

        approval.setProject(project);



        if (user.getRole() == Role.CLIENT) {

            approval.setClient(user);

        } else if (request.getClientId() != null) {

            User client = userRepository.findById(request.getClientId())

                    .orElseThrow(() -> new ResourceNotFoundException("Client not found"));

            approval.setClient(client);

        } else {

            throw new IllegalArgumentException("Client ID is required when creating an approval request");

        }



        Approval savedApproval = approvalRepository.save(approval);



        // Audit Log

        auditLogService.logAction(user, project, "REQUESTED", "APPROVAL", savedApproval.getId(), null,

                "Approval request created: " + savedApproval.getTitle() + " (" + savedApproval.getEntityType() + ")");



        return mapToResponse(savedApproval);

    }



    @Override

    @Transactional(readOnly = true)

    public List<ApprovalResponse> getApprovalsByProject(Long projectId, String loggedInEmail) {

        User user = userRepository.findByEmail(loggedInEmail)

                .orElseThrow(() -> new ResourceNotFoundException("User not found"));



        Project project = projectRepository.findById(projectId)

                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));



        if (user.getRole() != Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {

            throw new AccessDeniedException("User does not have access to this project");

        }



        if (user.getRole() == Role.CLIENT 

                || user.getRole().isDeveloper()

                || user.getRole() == Role.QA_TESTER) {

            boolean isMember = project.getMembers().stream()

                    .anyMatch(m -> m.getUser().getId().equals(user.getId()));

            if (!isMember) {

                throw new AccessDeniedException("You do not have permission to view this project");

            }

        }



        List<Approval> approvals = approvalRepository.findByProjectIdOrderByCreatedAtDesc(projectId);

        return approvals.stream().map(this::mapToResponse).collect(Collectors.toList());

    }



    @Override

    @Transactional

    public ApprovalResponse actionApproval(Long projectId, Long approvalId, ApprovalActionRequest request, String loggedInEmail) {

        User user = userRepository.findByEmail(loggedInEmail)

                .orElseThrow(() -> new ResourceNotFoundException("User not found"));



        Approval approval = approvalRepository.findById(approvalId)

                .orElseThrow(() -> new ResourceNotFoundException("Approval not found"));



        if (!approval.getProject().getId().equals(projectId)) {

            throw new IllegalArgumentException("Approval does not belong to the specified project");

        }



        if (approval.getRequestedBy() != null && approval.getRequestedBy().getId().equals(user.getId())) {

            throw new AccessDeniedException("You cannot approve or reject your own request.");

        }



        Project project = approval.getProject();

        if (user.getRole() != Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {

            throw new AccessDeniedException("User does not have access to this project");

        }



        ApprovalStatus newStatus = request.getStatus() != null ? request.getStatus() : ApprovalStatus.APPROVED;

        approval.setStatus(newStatus);

        

        if (request.getComments() != null && !request.getComments().isBlank()) {

            String updatedComments = (approval.getComments() != null ? approval.getComments() + "\n\n" : "") 

                    + "[" + user.getFullName() + " - " + newStatus + "]: " + request.getComments();

            approval.setComments(updatedComments);

        }



        if (request.getAttachmentUrl() != null && !request.getAttachmentUrl().isBlank()) {

            approval.setAttachmentUrl(request.getAttachmentUrl());

        }



        if (user.getRole() == Role.CLIENT) {

            approval.setClient(user);

        }



        Approval saved = approvalRepository.save(approval);



        // Audit Log

        String actionStr = newStatus.name();

        auditLogService.logAction(user, project, actionStr, "APPROVAL", saved.getId(), null,

                "Approval action performed: " + newStatus + " on " + saved.getTitle() + ". Notes: " + request.getComments());



        if ((newStatus == ApprovalStatus.CHANGES_REQUESTED || newStatus == ApprovalStatus.REJECTED) && saved.getRequestedBy() != null) {

            String title = newStatus == ApprovalStatus.CHANGES_REQUESTED ? "Changes Requested" : "Approval Declined";

            String msg = "Your request '" + saved.getTitle() + "' was reviewed by " + user.getFullName() + ". Status: " + newStatus + ". Feedback: " + request.getComments();

            notificationService.createNotification(saved.getRequestedBy(), title, msg, "APPROVAL_ACTION", saved.getId());

        }



        return mapToResponse(saved);

    }



    @Override

    @Transactional(readOnly = true)

    public List<ApprovalResponse> getMyApprovals(String loggedInEmail) {

        User user = userRepository.findByEmail(loggedInEmail)

                .orElseThrow(() -> new ResourceNotFoundException("User not found"));



        List<Project> userProjects;

        if (user.getRole() == Role.SUPER_ADMIN) {

            userProjects = projectRepository.findAll();

        } else if (user.getRole() == Role.ORG_ADMIN && user.getOrganization() != null) {

            userProjects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(user.getOrganization().getId());

        } else if (user.getOrganization() != null) {

            userProjects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(user.getOrganization().getId())

                    .stream()

                    .filter(p -> p.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(user.getId())))

                    .collect(Collectors.toList());

        } else {

            userProjects = List.of();

        }



        if (userProjects.isEmpty()) {

            return List.of();

        }



        List<Approval> approvals = approvalRepository.findByProjectInOrderByCreatedAtDesc(userProjects);

        return approvals.stream().map(this::mapToResponse).collect(Collectors.toList());

    }



    @Override

    @Transactional

    public void deleteApproval(Long projectId, Long approvalId, String loggedInEmail) {

        User user = userRepository.findByEmail(loggedInEmail)

                .orElseThrow(() -> new ResourceNotFoundException("User not found"));



        Approval approval = approvalRepository.findById(approvalId)

                .orElseThrow(() -> new ResourceNotFoundException("Approval not found"));



        if (!approval.getProject().getId().equals(projectId)) {

            throw new IllegalArgumentException("Approval does not belong to specified project");

        }



        if (user.getRole() != Role.SUPER_ADMIN && user.getRole() != Role.ORG_ADMIN && user.getRole() != Role.PROJECT_MANAGER) {

            if (approval.getRequestedBy() == null || !approval.getRequestedBy().getId().equals(user.getId())) {

                throw new AccessDeniedException("Only project managers, admins, or the original requester can delete this approval request.");

            }

        }



        approvalRepository.delete(approval);

    }



    private ApprovalResponse mapToResponse(Approval approval) {

        ApprovalResponse response = new ApprovalResponse();

        response.setId(approval.getId());

        response.setTitle(approval.getTitle() != null ? approval.getTitle() : "Approval Request #" + approval.getId());

        response.setEntityType(approval.getEntityType());

        response.setEntityId(approval.getEntityId());

        response.setStatus(approval.getStatus());

        response.setComments(approval.getComments());

        response.setAttachmentUrl(approval.getAttachmentUrl());



        if (approval.getClient() != null) {

            response.setClientId(approval.getClient().getId());

            response.setClientName(approval.getClient().getFullName());

        }



        if (approval.getRequestedBy() != null) {

            response.setRequestedById(approval.getRequestedBy().getId());

            response.setRequestedByName(approval.getRequestedBy().getFullName());

            response.setRequestedByRole(approval.getRequestedBy().getRole() != null ? approval.getRequestedBy().getRole().name() : null);

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
