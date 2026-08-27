package com.neuroforge.dto.bug;

import com.neuroforge.enums.BugStatus;
import com.neuroforge.enums.TaskPriority;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class BugResponse {
    private Long id;
    private String title;
    private String description;
    private BugStatus status;
    private TaskPriority priority;
    private TaskPriority severity;
    
    private Long projectId;
    private String projectName;
    
    private Long sprintId;
    private String sprintName;

    private Long taskId;
    private String taskTitle;
    
    private Long reporterId;
    private String reporterName;
    
    private Long assigneeId;
    private String assigneeName;

    private String stepsToReproduce;
    private String expectedResult;
    private String actualResult;
    private String attachmentUrl;
    private String retestComments;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
