package com.neuroforge.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "spec_metadata")
@Data
@NoArgsConstructor
public class SpecMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String featureName;

    @Column(nullable = false)
    private String status; // "DRAFT", "IN_REVIEW", "APPROVED"

    @ManyToOne
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public SpecMetadata(String featureName, User createdBy) {
        this.featureName = featureName;
        this.status = "DRAFT";
        this.createdBy = createdBy;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}

