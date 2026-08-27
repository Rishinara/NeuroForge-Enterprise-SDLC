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
    private String title;
    private ApprovalEntityType entityType;
    private Long entityId;
    private ApprovalStatus status;
    private String comments;
    private String attachmentUrl;
    
    private Long clientId;
    private String clientName;

    private Long requestedById;
    private String requestedByName;
    private String requestedByRole;
    
    private Long projectId;
    private String projectName;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

