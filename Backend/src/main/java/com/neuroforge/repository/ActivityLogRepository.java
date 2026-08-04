package com.neuroforge.repository;

import com.neuroforge.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop20ByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
}
