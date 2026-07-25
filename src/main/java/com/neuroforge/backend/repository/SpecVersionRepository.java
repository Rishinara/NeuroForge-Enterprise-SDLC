package com.neuroforge.backend.repository;

import com.neuroforge.backend.entity.SpecVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecVersionRepository extends JpaRepository<SpecVersion, Long> {
    List<SpecVersion> findBySpecMetadataIdOrderByVersionNumberDesc(Long specMetadataId);
    SpecVersion findTopBySpecMetadataIdOrderByVersionNumberDesc(Long specMetadataId);
}
