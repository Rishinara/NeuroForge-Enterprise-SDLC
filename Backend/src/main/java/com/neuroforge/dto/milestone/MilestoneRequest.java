package com.neuroforge.dto.milestone;

import com.neuroforge.enums.MilestoneStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MilestoneRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Status is required")
    private MilestoneStatus status;

    @NotNull(message = "Expected Delivery Date is required")
    private LocalDate expectedDeliveryDate;

    private LocalDate actualDeliveryDate;

    @NotNull(message = "Project ID is required")
    private Long projectId;
}
