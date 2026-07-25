package com.neuroforge.backend.repository;

import com.neuroforge.backend.entity.SpecMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecMetadataRepository extends JpaRepository<SpecMetadata, Long> {
    List<SpecMetadata> findByStatus(String status);
}
