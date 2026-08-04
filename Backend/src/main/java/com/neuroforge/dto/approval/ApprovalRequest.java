package com.neuroforge.dto.approval;

import com.neuroforge.enums.ApprovalStatus;
import com.neuroforge.enums.ApprovalEntityType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalRequest {

    @NotNull(message = "Entity Type is required")
    private ApprovalEntityType entityType;

    @NotNull(message = "Entity ID is required")
    private Long entityId;

    @NotNull(message = "Status is required")
    private ApprovalStatus status;

    private String comments;

    @NotNull(message = "Project ID is required")
    private Long projectId;
}
