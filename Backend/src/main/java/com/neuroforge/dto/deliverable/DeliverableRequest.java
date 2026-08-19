package com.neuroforge.dto.deliverable;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeliverableRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    
    private String fileUrl;

    private Long milestoneId;
}
