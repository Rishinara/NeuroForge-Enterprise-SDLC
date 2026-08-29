package com.neuroforge.repository;

import com.neuroforge.entity.Task;
import com.neuroforge.enums.TaskStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @EntityGraph(attributePaths = {
            "project",
            "sprint",
            "team",
            "assignee",
            "reporter",
            "labels"
    })
    List<Task> findByAssigneeId(Long assigneeId);

    @EntityGraph(attributePaths = {
            "project",
            "sprint",
            "team",
            "assignee",
            "reporter",
            "labels"
    })
    List<Task> findByReporterId(Long reporterId);

    @EntityGraph(attributePaths = {
            "project",
            "sprint",
            "team",
            "assignee",
            "reporter",
            "labels"
    })
    List<Task> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {
            "project",
            "sprint",
            "team",
            "assignee",
            "reporter",
            "labels"
    })
    List<Task> findBySprintId(Long sprintId);

    @EntityGraph(attributePaths = {
            "project",
            "sprint",
            "team",
            "assignee",
            "reporter",
            "labels"
    })
    List<Task> findByProjectIdAndSprintIsNull(Long projectId);

    @EntityGraph(attributePaths = {
            "project",
            "sprint",
            "team",
            "assignee",
            "reporter",
            "labels"
    })
    Optional<Task> findTaskById(Long id);

    @EntityGraph(attributePaths = {
            "project",
            "sprint",
            "assignee",
            "reporter",
            "labels"
    })
    List<Task> findBySprintIdOrderByPriorityAscCreatedAtAsc(Long sprintId);

    long countBySprintIdAndStatus(Long sprintId, TaskStatus status);
}