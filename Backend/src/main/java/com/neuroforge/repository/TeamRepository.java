package com.neuroforge.repository;

import com.neuroforge.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByOrganizationId(Long orgId);
    boolean existsByOrganizationIdAndNameIgnoreCase(Long organizationId, String name);
}
