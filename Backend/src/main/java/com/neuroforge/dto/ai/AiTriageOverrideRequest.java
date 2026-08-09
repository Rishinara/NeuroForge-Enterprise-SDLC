package com.neuroforge.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTriageOverrideRequest {
    private String category;
    private String priority;
    private Integer storyPoints;
    private Long assigneeId;
}
