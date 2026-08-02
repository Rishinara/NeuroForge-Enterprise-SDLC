package com.neuroforge.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
@JoinColumn(name = "organization_id", nullable = false)    private Organization organization;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String details;

    @Column(name = "actor_email", nullable = false)
    private String actorEmail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public ActivityLog(Organization organization, String action, String details, String actorEmail) {
        this.organization = organization;
        this.action = action;
        this.details = details;
        this.actorEmail = actorEmail;
    }
}
