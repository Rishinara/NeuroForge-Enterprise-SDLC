package com.neuroforge.repository;

import com.neuroforge.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByOrganizationIdAndNameIgnoreCase(Long organizationId, String name);

    List<Project> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    Optional<Project> findById(Long id);

}