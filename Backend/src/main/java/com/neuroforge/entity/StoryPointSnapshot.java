package com.neuroforge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "story_point_snapshots",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"sprint_id", "snapshot_date"})
        },
        indexes = {
                @Index(name = "idx_snapshot_sprint_id", columnList = "sprint_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryPointSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id", nullable = false)
    private Sprint sprint;

    @Column(nullable = false)
    private LocalDate snapshotDate;

    @Column(nullable = false)
    private Integer totalStoryPoints;

    @Column(nullable = false)
    private Integer completedStoryPoints;

    @Column(nullable = false)
    private Integer remainingStoryPoints;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}