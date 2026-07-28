package com.neuroforge.controller;

import com.neuroforge.entity.SpecMetadata;
import com.neuroforge.entity.SpecVersion;
import com.neuroforge.service.AISpecService;
import com.neuroforge.service.SpecManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/specs")
public class SpecController {

    private final AISpecService aiSpecService;
    private final SpecManagementService specManagementService;

    public SpecController(AISpecService aiSpecService, SpecManagementService specManagementService) {
        this.aiSpecService = aiSpecService;
        this.specManagementService = specManagementService;
    }

    /**
     * Endpoint for PM to generate structured JSON specs from a plain-English description.
     */
    @PostMapping("/generate")
    public ResponseEntity<SpecVersion.SpecContent> generateSpecs(@RequestBody Map<String, String> request) {
        String description = request.get("description");
        if (description == null || description.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        SpecVersion.SpecContent generatedContent = aiSpecService.generateSpecsFromDescription(description);
        return ResponseEntity.ok(generatedContent);
    }

    /**
     * Endpoint to save the generated/edited JSON as a draft (v1).
     */
    @PostMapping
    public ResponseEntity<SpecVersion> createSpec(
            @RequestParam String featureName,
            @RequestParam Long userId,
            @RequestBody SpecVersion.SpecContent content) {

        SpecVersion newVersion = specManagementService.saveDraft(featureName, content, userId);
        return ResponseEntity.ok(newVersion);
    }

    /**
     * Endpoint to update an existing spec.
     * Handles versioning logic automatically (creates v2 if currently APPROVED).
     */
    @PutMapping("/{id}")
    public ResponseEntity<SpecVersion> updateSpec(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestBody SpecVersion.SpecContent updatedContent) {

        SpecVersion version = specManagementService.updateSpec(id, updatedContent, userId);
        return ResponseEntity.ok(version);
    }

    /**
     * Endpoint to approve a spec.
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<SpecVersion> approveSpec(
            @PathVariable Long id,
            @RequestParam Long approverUserId) {

        SpecVersion version = specManagementService.approveSpec(id, approverUserId);
        return ResponseEntity.ok(version);
    }

    /**
     * Endpoint to get all specs metadata.
     */
    @GetMapping
    public ResponseEntity<List<SpecMetadata>> getAllSpecs() {
        return ResponseEntity.ok(specManagementService.getAllSpecs());
    }

    /**
     * Endpoint to get the latest version content of a specific spec.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SpecVersion> getLatestSpecVersion(@PathVariable Long id) {
        return ResponseEntity.ok(specManagementService.getLatestVersion(id));
    }
}
