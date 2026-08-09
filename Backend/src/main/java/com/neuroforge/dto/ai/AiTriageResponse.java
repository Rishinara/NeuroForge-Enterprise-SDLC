package com.neuroforge.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTriageResponse {
    private String id;
    private Long taskId;
    private String category;
    private String priority;
    private Integer estimatedStoryPoints;
    private Long suggestedAssigneeId;
    private String suggestedAssigneeName;
    private String reasoning;
    private String status;
    private LocalDateTime createdAt;
}
