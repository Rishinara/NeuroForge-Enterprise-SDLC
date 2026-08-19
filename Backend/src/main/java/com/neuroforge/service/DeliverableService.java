package com.neuroforge.service;

import com.neuroforge.dto.deliverable.ClientActionRequest;
import com.neuroforge.dto.deliverable.DeliverableRequest;
import com.neuroforge.dto.deliverable.DeliverableResponse;
import com.neuroforge.entity.*;
import com.neuroforge.enums.ApprovalEntityType;
import com.neuroforge.enums.ApprovalStatus;
import com.neuroforge.enums.DeliverableStatus;
import com.neuroforge.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliverableService {

    private final DeliverableRepository deliverableRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final UserRepository userRepository;
    private final ApprovalRepository approvalRepository;
    private final AuditLogService auditLogService;



    public DeliverableResponse updateDeliverable(Long deliverableId, DeliverableRequest request, String username) {
        Deliverable deliverable = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new RuntimeException("Deliverable not found"));
        
        if (deliverable.getStatus() == DeliverableStatus.APPROVED) {
            throw new RuntimeException("Cannot update an approved deliverable.");
        }
        
        deliverable.setTitle(request.getTitle());
        deliverable.setDescription(request.getDescription());
        deliverable.setFileUrl(request.getFileUrl());
        
        if (request.getMilestoneId() != null) {
            Milestone milestone = milestoneRepository.findById(request.getMilestoneId())
                    .orElseThrow(() -> new RuntimeException("Milestone not found"));
            deliverable.setMilestone(milestone);
        } else {
            deliverable.setMilestone(null);
        }
        
        deliverable = deliverableRepository.save(deliverable);
        return mapToResponse(deliverable);
    }

    public List<DeliverableResponse> getDeliverablesByProject(Long projectId) {
        return deliverableRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DeliverableResponse submitDeliverable(Long deliverableId, String username) {
        Deliverable deliverable = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new RuntimeException("Deliverable not found"));
        
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (deliverable.getStatus() == DeliverableStatus.APPROVED) {
            throw new RuntimeException("Deliverable is already approved.");
        }

        deliverable.setStatus(DeliverableStatus.SUBMITTED);
        deliverable.setVersion(deliverable.getVersion() + 1);
        deliverable = deliverableRepository.save(deliverable);
        
        auditLogService.logAction(user, deliverable.getProject(), "SUBMITTED", "DELIVERABLE", deliverable.getId(), null, "Deliverable submitted for client review.");
        
        return mapToResponse(deliverable);
    }

    public DeliverableResponse processClientAction(Long deliverableId, ClientActionRequest request, String username) {
        Deliverable deliverable = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new RuntimeException("Deliverable not found"));
        User client = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (deliverable.getStatus() != DeliverableStatus.SUBMITTED) {
            throw new RuntimeException("Deliverable is not in SUBMITTED state.");
        }

        DeliverableStatus newStatus;
        ApprovalStatus approvalStatus;

        switch (request.getAction().toUpperCase()) {
            case "APPROVED":
                newStatus = DeliverableStatus.APPROVED;
                approvalStatus = ApprovalStatus.APPROVED;
                break;
            case "REJECTED":
                newStatus = DeliverableStatus.REJECTED;
                approvalStatus = ApprovalStatus.REJECTED;
                break;
            case "CHANGES_REQUESTED":
                newStatus = DeliverableStatus.CHANGES_REQUESTED;
                approvalStatus = ApprovalStatus.REJECTED; // Using REJECTED in Approval to indicate not approved yet
                break;
            default:
                throw new RuntimeException("Invalid action: " + request.getAction());
        }

        deliverable.setStatus(newStatus);
        deliverable = deliverableRepository.save(deliverable);

        Approval approval = new Approval();
        approval.setEntityType(ApprovalEntityType.DELIVERABLE);
        approval.setEntityId(deliverable.getId());
        approval.setStatus(approvalStatus);
        approval.setComments(request.getComments());
        approval.setClient(client);
        approval.setProject(deliverable.getProject());
        approvalRepository.save(approval);

        String details = "Client Action: " + request.getAction() + ". Comments: " + request.getComments();
        if (request.getAttachedFileUrl() != null && !request.getAttachedFileUrl().isEmpty()) {
            details += " | Attachment: " + request.getAttachedFileUrl();
        }

        auditLogService.logAction(client, deliverable.getProject(), request.getAction().toUpperCase(), "DELIVERABLE", deliverable.getId(), null, details);

        return mapToResponse(deliverable);
    }

    private DeliverableResponse mapToResponse(Deliverable d) {
        DeliverableResponse response = new DeliverableResponse();
        response.setId(d.getId());
        response.setTitle(d.getTitle());
        response.setDescription(d.getDescription());
        response.setFileUrl(d.getFileUrl());
        response.setVersion(d.getVersion());
        response.setStatus(d.getStatus());
        response.setProjectId(d.getProject().getId());
        if (d.getMilestone() != null) {
            response.setMilestoneId(d.getMilestone().getId());
        }
        response.setAuthorName(d.getAuthor().getFullName());
        response.setCreatedAt(d.getCreatedAt());
        response.setUpdatedAt(d.getUpdatedAt());
        return response;
    }
}
