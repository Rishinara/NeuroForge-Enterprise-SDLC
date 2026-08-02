package com.neuroforge.controller;

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
@RequestMapping("/api/projects/{projectId}/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public ApprovalResponse createApproval(
            @PathVariable Long projectId,
            @Valid @RequestBody ApprovalRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
            
        request.setProjectId(projectId);
        return approvalService.createApproval(request, userDetails.getUsername());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'QA_TESTER', 'DEVELOPER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public List<ApprovalResponse> getApprovals(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return approvalService.getApprovalsByProject(projectId, userDetails.getUsername());
    }
}
