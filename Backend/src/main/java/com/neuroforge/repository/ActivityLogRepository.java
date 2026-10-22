package com.neuroforge.repository;

import com.neuroforge.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop50ByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    List<ActivityLog> findTop50ByOrganizationIdAndProjectIdOrderByCreatedAtDesc(Long organizationId, Long projectId);

    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.organization.id = :orgId")
    void deleteByOrganizationId(@Param("orgId") Long orgId);
}
