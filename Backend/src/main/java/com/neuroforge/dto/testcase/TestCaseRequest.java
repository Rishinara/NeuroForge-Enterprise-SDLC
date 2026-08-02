package com.neuroforge.dto.testcase;

import com.neuroforge.enums.TestCaseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TestCaseRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    
    private String expectedResult;
    
    @NotNull(message = "Status is required")
    private TestCaseStatus status;

    private String notes;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private Long sprintId;

    private Long assignedTesterId;
}
