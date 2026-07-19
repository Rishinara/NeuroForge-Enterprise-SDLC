package com.neuroforge.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_health_snapshots")
public class ProjectHealthSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Project project;

    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;

    @Column(name = "tasks_done_percentage", nullable = false)
    private Double tasksDonePercentage;

    @Column(name = "timeline_elapsed_percentage", nullable = false)
    private Double timelineElapsedPercentage;

    @Column(name = "health_status", nullable = false)
    private String healthStatus;

    public ProjectHealthSnapshot() {
    }

    public ProjectHealthSnapshot(Project project, Double tasksDonePercentage, Double timelineElapsedPercentage, String healthStatus) {
        this.project = project;
        this.tasksDonePercentage = tasksDonePercentage;
        this.timelineElapsedPercentage = timelineElapsedPercentage;
        this.healthStatus = healthStatus;
        this.calculatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }

    public Double getTasksDonePercentage() {
        return tasksDonePercentage;
    }

    public void setTasksDonePercentage(Double tasksDonePercentage) {
        this.tasksDonePercentage = tasksDonePercentage;
    }

    public Double getTimelineElapsedPercentage() {
        return timelineElapsedPercentage;
    }

    public void setTimelineElapsedPercentage(Double timelineElapsedPercentage) {
        this.timelineElapsedPercentage = timelineElapsedPercentage;
    }

    public String getHealthStatus() {
        return healthStatus;
    }

    public void setHealthStatus(String healthStatus) {
        this.healthStatus = healthStatus;
    }
}
