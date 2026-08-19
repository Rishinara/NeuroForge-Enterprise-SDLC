package com.neuroforge.dto.approval;

import com.neuroforge.enums.ApprovalStatus;
import com.neuroforge.enums.ApprovalEntityType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalRequest {

    private String title;

    private ApprovalEntityType entityType = ApprovalEntityType.GENERAL;

    private Long entityId;

    private ApprovalStatus status;

    private String comments;

    private String attachmentUrl;

    private Long projectId;

    private Long clientId;
}

