package com.neuroforge.service;

import com.neuroforge.dto.approval.ApprovalRequest;
import com.neuroforge.dto.approval.ApprovalResponse;

import java.util.List;

public interface ApprovalService {
    ApprovalResponse createApproval(ApprovalRequest request, String loggedInEmail);
    List<ApprovalResponse> getApprovalsByProject(Long projectId, String loggedInEmail);
}
