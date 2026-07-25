package com.neuroforge.repository;

import com.neuroforge.entity.StoryPointSnapshot;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StoryPointSnapshotRepository extends JpaRepository<StoryPointSnapshot, Long> {

    @EntityGraph(attributePaths = "sprint")
    List<StoryPointSnapshot> findBySprintIdOrderBySnapshotDateAsc(Long sprintId);

    Optional<StoryPointSnapshot> findBySprintIdAndSnapshotDate(
            Long sprintId,
            LocalDate snapshotDate);
}