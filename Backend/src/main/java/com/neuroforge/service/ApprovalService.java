package com.neuroforge.service;

import com.neuroforge.dto.approval.ApprovalActionRequest;
import com.neuroforge.dto.approval.ApprovalRequest;
import com.neuroforge.dto.approval.ApprovalResponse;

import java.util.List;

public interface ApprovalService {
    ApprovalResponse createApproval(ApprovalRequest request, String loggedInEmail);
    List<ApprovalResponse> getApprovalsByProject(Long projectId, String loggedInEmail);
    ApprovalResponse actionApproval(Long projectId, Long approvalId, ApprovalActionRequest request, String loggedInEmail);
    List<ApprovalResponse> getMyApprovals(String loggedInEmail);
    void deleteApproval(Long projectId, Long approvalId, String loggedInEmail);
}

