package com.neuroforge.repository;

import com.neuroforge.entity.Spec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpecRepository extends JpaRepository<Spec, Long> {
    List<Spec> findAllByProjectId(Long projectId);
    List<Spec> findAllByParentSpecIdOrId(Long parentSpecId, Long id);
    Optional<Spec> findById(Long id);
    boolean existsByProjectId(Long projectId);
}
