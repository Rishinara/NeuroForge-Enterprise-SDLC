package com.neuroforge.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "spec_version")
@Data
@NoArgsConstructor
public class SpecVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "spec_metadata_id", nullable = false)
    private SpecMetadata specMetadata;

    @Column(nullable = false)
    private Integer versionNumber;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private SpecContent content;

    @ManyToOne
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    private LocalDateTime approvalDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public SpecVersion(SpecMetadata specMetadata, Integer versionNumber, SpecContent content) {
        this.specMetadata = specMetadata;
        this.versionNumber = versionNumber;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    @Data
    @NoArgsConstructor
    public static class SpecContent {
        private String rawDescription;
        private List<UserStory> userStories;
        private List<AcceptanceCriteria> acceptanceCriteria;
        private List<String> functionalRequirements;
        private List<String> nonFunctionalRequirements;
    }

    @Data
    @NoArgsConstructor
    public static class UserStory {
        private String asA;
        private String iWantTo;
        private String soThat;
    }

    @Data
    @NoArgsConstructor
    public static class AcceptanceCriteria {
        private String title;
        private List<String> criteria;
    }
}
