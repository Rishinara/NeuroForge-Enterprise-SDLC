package com.neuroforge.dto.approval;

import com.neuroforge.enums.ApprovalStatus;
import com.neuroforge.enums.ApprovalEntityType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ApprovalResponse {
    private Long id;
    private ApprovalEntityType entityType;
    private Long entityId;
    private ApprovalStatus status;
    private String comments;
    
    private Long clientId;
    private String clientName;
    
    private Long projectId;
    private String projectName;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
