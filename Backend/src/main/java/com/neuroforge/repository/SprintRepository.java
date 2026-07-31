package com.neuroforge.repository;

import com.neuroforge.entity.Sprint;
import com.neuroforge.enums.SprintStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {

    @EntityGraph(attributePaths = {"project", "createdBy"})
    Optional<Sprint> findSprintById(Long id);

    @EntityGraph(attributePaths = {"project", "createdBy"})
    List<Sprint> findAllByProjectId(Long projectId);

    boolean existsByProjectIdAndNameIgnoreCase(Long projectId, String name);

    @EntityGraph(attributePaths = {"project", "createdBy"})
    Optional<Sprint> findByProjectIdAndStatus(Long projectId, SprintStatus status);

    boolean existsByProjectIdAndStatus(Long projectId, SprintStatus status);
}