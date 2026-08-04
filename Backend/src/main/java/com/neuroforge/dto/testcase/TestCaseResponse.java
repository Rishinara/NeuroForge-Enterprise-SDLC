package com.neuroforge.dto.testcase;

import com.neuroforge.enums.TestCaseStatus;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class TestCaseResponse {
    private Long id;
    private String title;
    private String description;
    private String expectedResult;
    private TestCaseStatus status;
    private String notes;
    
    private Long projectId;
    private String projectName;
    
    private Long sprintId;
    private String sprintName;
    
    private Long assignedTesterId;
    private String assignedTesterName;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
