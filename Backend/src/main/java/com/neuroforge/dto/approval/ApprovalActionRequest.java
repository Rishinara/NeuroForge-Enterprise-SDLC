package com.neuroforge.dto.approval;

import com.neuroforge.enums.ApprovalStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalActionRequest {
    private ApprovalStatus status;
    private String comments;
    private String attachmentUrl;
}
