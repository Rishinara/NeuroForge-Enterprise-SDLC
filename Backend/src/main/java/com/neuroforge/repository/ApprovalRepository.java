package com.neuroforge.repository;

import com.neuroforge.entity.Approval;
import com.neuroforge.entity.Project;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    @EntityGraph(attributePaths = {"client", "requestedBy", "project"})
    List<Approval> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {"client", "requestedBy", "project"})
    List<Approval> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    @EntityGraph(attributePaths = {"client", "requestedBy", "project"})
    List<Approval> findByProjectInOrderByCreatedAtDesc(List<Project> projects);
}

