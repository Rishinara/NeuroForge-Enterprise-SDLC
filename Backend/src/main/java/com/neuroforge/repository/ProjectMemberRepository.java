package com.neuroforge.repository;

import com.neuroforge.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ProjectMemberRepository
        extends JpaRepository<ProjectMember, Long> {

    List<ProjectMember> findByProjectId(Long projectId);

    boolean existsByProjectIdAndUserId(
            Long projectId,
            Long userId
    );

    boolean existsByUserId(Long userId);

    boolean existsByUserIdAndProjectIdNot(Long userId, Long projectId);

    long countByUserId(Long userId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project"})
    List<ProjectMember> findByUserId(Long userId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project", "user"})
    List<ProjectMember> findByProjectOrganizationId(Long orgId);

    void deleteByProjectId(Long projectId);
    void deleteByUserId(Long userId);
}
