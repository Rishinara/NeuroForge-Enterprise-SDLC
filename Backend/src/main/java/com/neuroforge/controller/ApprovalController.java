package com.neuroforge.controller;

import com.neuroforge.dto.approval.ApprovalActionRequest;
import com.neuroforge.dto.approval.ApprovalRequest;
import com.neuroforge.dto.approval.ApprovalResponse;
import com.neuroforge.service.ApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping("/api/projects/{projectId}/approvals")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public ApprovalResponse createApproval(
            @PathVariable Long projectId,
            @Valid @RequestBody ApprovalRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
            
        request.setProjectId(projectId);
        return approvalService.createApproval(request, userDetails.getUsername());
    }

    @GetMapping("/api/projects/{projectId}/approvals")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'QA_TESTER', 'DEVELOPER', 'FRONTEND_DEVELOPER', 'BACKEND_DEVELOPER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public List<ApprovalResponse> getApprovals(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return approvalService.getApprovalsByProject(projectId, userDetails.getUsername());
    }

    @PutMapping("/api/projects/{projectId}/approvals/{approvalId}/action")
    @PreAuthorize("hasAnyRole('CLIENT', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public ApprovalResponse actionApproval(
            @PathVariable Long projectId,
            @PathVariable Long approvalId,
            @RequestBody ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return approvalService.actionApproval(projectId, approvalId, request, userDetails.getUsername());
    }

    @GetMapping("/api/approvals/my")
    @PreAuthorize("hasAnyRole('CLIENT', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN', 'DEVELOPER', 'FRONTEND_DEVELOPER', 'BACKEND_DEVELOPER', 'QA_TESTER')")
    public List<ApprovalResponse> getMyApprovals(@AuthenticationPrincipal UserDetails userDetails) {
        return approvalService.getMyApprovals(userDetails.getUsername());
    }

    @DeleteMapping("/api/projects/{projectId}/approvals/{approvalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public void deleteApproval(
            @PathVariable Long projectId,
            @PathVariable Long approvalId,
            @AuthenticationPrincipal UserDetails userDetails) {

        approvalService.deleteApproval(projectId, approvalId, userDetails.getUsername());
    }
}

