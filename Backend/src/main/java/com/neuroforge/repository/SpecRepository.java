package com.neuroforge.repository;

import com.neuroforge.entity.Spec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpecRepository extends JpaRepository<Spec, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"userStories", "parentSpec", "createdBy"})
    List<Spec> findAllByProjectId(Long projectId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"userStories", "parentSpec", "createdBy"})
    List<Spec> findAllByParentSpecIdOrId(Long parentSpecId, Long id);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"userStories", "parentSpec", "createdBy"})
    Optional<Spec> findById(Long id);
}
