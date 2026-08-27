package com.neuroforge.dto.deliverable;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClientActionRequest {

    @NotBlank(message = "Action is required (APPROVED, REJECTED, CHANGES_REQUESTED)")
    private String action;

    @NotBlank(message = "Comments are required for this action")
    private String comments;

    private String attachedFileUrl;
}
