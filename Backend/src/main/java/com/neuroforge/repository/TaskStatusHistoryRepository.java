package com.neuroforge.repository;

import com.neuroforge.entity.TaskStatusHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskStatusHistoryRepository extends JpaRepository<TaskStatusHistory, Long> {

    @EntityGraph(attributePaths = {
            "task",
            "changedBy"
    })
    List<TaskStatusHistory> findByTaskIdOrderByChangedAtAsc(Long taskId);
}