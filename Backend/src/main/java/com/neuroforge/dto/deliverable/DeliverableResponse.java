package com.neuroforge.dto.deliverable;

import com.neuroforge.enums.DeliverableStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeliverableResponse {
    private Long id;
    private String title;
    private String description;
    private String fileUrl;
    private Integer version;
    private DeliverableStatus status;
    private Long projectId;
    private Long milestoneId;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
