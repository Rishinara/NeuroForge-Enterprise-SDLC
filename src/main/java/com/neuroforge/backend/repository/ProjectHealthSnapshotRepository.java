package com.neuroforge.backend.repository;

import com.neuroforge.backend.entity.ProjectHealthSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectHealthSnapshotRepository extends JpaRepository<ProjectHealthSnapshot, Long> {

    List<ProjectHealthSnapshot> findByProjectIdOrderByCalculatedAtDesc(Long projectId);
}
