package com.neuroforge.dto.milestone;

import com.neuroforge.enums.MilestoneStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class MilestoneResponse {
    private Long id;
    private String title;
    private String description;
    private MilestoneStatus status;
    private LocalDate expectedDeliveryDate;
    private LocalDate actualDeliveryDate;
    
    private Long projectId;
    private String projectName;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
