package com.neuroforge.backend.repository;

import com.neuroforge.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOrganizationId(Long orgId);

    @Query("SELECT p FROM Project p JOIN p.members m WHERE p.organization.id = :orgId AND m.id = :userId")
    List<Project> findByOrganizationIdAndMemberId(@Param("orgId") Long orgId, @Param("userId") Long userId);
}
