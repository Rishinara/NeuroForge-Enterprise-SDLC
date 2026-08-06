package com.neuroforge.entity;

import com.neuroforge.enums.SpecStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "specs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Spec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 3000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpecStatus status = SpecStatus.Draft;

    @Column(nullable = false)
    private Integer version = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@JoinColumn(name = "project_id", nullable = false)    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@JoinColumn(name = "parent_spec_id")    private Spec parentSpec;

    @OneToMany(mappedBy = "spec", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserStory> userStories = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "spec_functional_requirements",
            joinColumns = @JoinColumn(name = "spec_id")
    )
    @Column(name = "requirement", length = 2000)
    @Builder.Default
    private List<String> functionalRequirements = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "spec_non_functional_requirements",
            joinColumns = @JoinColumn(name = "spec_id")
    )
    @Column(name = "requirement", length = 2000)
    @Builder.Default
    private List<String> nonFunctionalRequirements = new ArrayList<>();

    @Column(name = "review_note", length = 3000)
    private String reviewNote;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
