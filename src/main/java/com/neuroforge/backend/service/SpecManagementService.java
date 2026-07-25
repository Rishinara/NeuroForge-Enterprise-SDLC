package com.neuroforge.backend.service;

import com.neuroforge.backend.entity.SpecMetadata;
import com.neuroforge.backend.entity.SpecVersion;
import com.neuroforge.backend.entity.User;
import com.neuroforge.backend.repository.SpecMetadataRepository;
import com.neuroforge.backend.repository.SpecVersionRepository;
import com.neuroforge.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SpecManagementService {

    private final SpecMetadataRepository metadataRepository;
    private final SpecVersionRepository versionRepository;
    private final UserRepository userRepository; // Assuming a UserRepository exists from previous modules

    public SpecManagementService(SpecMetadataRepository metadataRepository,
                                 SpecVersionRepository versionRepository,
                                 UserRepository userRepository) {
        this.metadataRepository = metadataRepository;
        this.versionRepository = versionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SpecVersion saveDraft(String featureName, SpecVersion.SpecContent content, Long creatorUserId) {
        User creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create new Metadata
        SpecMetadata metadata = new SpecMetadata(featureName, creator);
        metadata = metadataRepository.save(metadata);

        // Create Version 1
        SpecVersion version = new SpecVersion(metadata, 1, content);
        return versionRepository.save(version);
    }

    @Transactional
    public SpecVersion updateSpec(Long metadataId, SpecVersion.SpecContent updatedContent, Long userId) {
        SpecMetadata metadata = metadataRepository.findById(metadataId)
                .orElseThrow(() -> new RuntimeException("Spec not found"));

        SpecVersion latestVersion = versionRepository.findTopBySpecMetadataIdOrderByVersionNumberDesc(metadataId);

        if ("APPROVED".equals(metadata.getStatus())) {
            // If approved, create a new draft version (e.g., v2)
            metadata.setStatus("DRAFT");
            metadata.setUpdatedAt(LocalDateTime.now());
            metadataRepository.save(metadata);

            SpecVersion newVersion = new SpecVersion(metadata, latestVersion.getVersionNumber() + 1, updatedContent);
            return versionRepository.save(newVersion);
        } else {
            // If still in draft or review, just update the latest version's content
            latestVersion.setContent(updatedContent);
            latestVersion.setCreatedAt(LocalDateTime.now()); // Update timestamp
            metadata.setUpdatedAt(LocalDateTime.now());
            metadataRepository.save(metadata);
            
            return versionRepository.save(latestVersion);
        }
    }

    @Transactional
    public SpecVersion approveSpec(Long metadataId, Long approverUserId) {
        User approver = userRepository.findById(approverUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SpecMetadata metadata = metadataRepository.findById(metadataId)
                .orElseThrow(() -> new RuntimeException("Spec not found"));

        metadata.setStatus("APPROVED");
        metadata.setUpdatedAt(LocalDateTime.now());
        metadataRepository.save(metadata);

        SpecVersion latestVersion = versionRepository.findTopBySpecMetadataIdOrderByVersionNumberDesc(metadataId);
        latestVersion.setApprovedBy(approver);
        latestVersion.setApprovalDate(LocalDateTime.now());
        
        return versionRepository.save(latestVersion);
    }
    
    @Transactional(readOnly = true)
    public List<SpecMetadata> getAllSpecs() {
        return metadataRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public SpecVersion getLatestVersion(Long metadataId) {
        return versionRepository.findTopBySpecMetadataIdOrderByVersionNumberDesc(metadataId);
    }
}
