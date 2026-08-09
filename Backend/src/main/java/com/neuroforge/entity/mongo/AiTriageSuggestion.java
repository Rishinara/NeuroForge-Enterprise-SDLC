package com.neuroforge.entity.mongo;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "ai_triage_suggestions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiTriageSuggestion {

    @Id
    private String id;

    @Indexed
    private Long taskId;

    private String category; // Frontend, Backend, DB, DevOps
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL
    private Integer estimatedStoryPoints;
    
    private Long suggestedAssigneeId;
    private String suggestedAssigneeName;
    private String reasoning; // e.g. "suggested Kumanan - resolved 8 similar payment bugs"
    
    private String status; // PENDING, ACCEPTED, REJECTED, OVERRIDDEN

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
