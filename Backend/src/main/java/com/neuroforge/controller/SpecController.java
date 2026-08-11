package com.neuroforge.controller;

import com.neuroforge.dto.spec.SpecRequest;
import com.neuroforge.dto.spec.SpecResponse;
import com.neuroforge.dto.spec.SpecSummaryResponse;
import com.neuroforge.dto.spec.SpecVersionDTO;
import com.neuroforge.service.SpecService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SpecController {

    private final SpecService specService;

    @GetMapping("/projects/{projectId}/specs")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','DEVELOPER','QA_TESTER','CLIENT','USER','ROLE_USER')")
    public ResponseEntity<List<SpecSummaryResponse>> getSpecsByProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(specService.getSpecsByProject(projectId, userDetails.getUsername()));
    }

    @PostMapping("/projects/{projectId}/specs")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','USER','ROLE_USER')")
    public ResponseEntity<SpecResponse> createSpec(
            @PathVariable Long projectId,
            @RequestBody SpecRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return new ResponseEntity<>(specService.createSpec(projectId, request, userDetails.getUsername()), HttpStatus.CREATED);
    }

    @GetMapping("/specs/{specId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','DEVELOPER','QA_TESTER','CLIENT','USER','ROLE_USER')")
    public ResponseEntity<SpecResponse> getSpecById(
            @PathVariable Long specId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(specService.getSpecById(specId, userDetails.getUsername()));
    }

    @PutMapping("/specs/{specId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','USER','ROLE_USER')")
    public ResponseEntity<SpecResponse> updateSpec(
            @PathVariable Long specId,
            @RequestBody SpecRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(specService.updateSpec(specId, request, userDetails.getUsername()));
    }

    @GetMapping("/specs/{specId}/versions")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','DEVELOPER','QA_TESTER','CLIENT','USER','ROLE_USER')")
    public ResponseEntity<List<SpecVersionDTO>> getSpecVersions(
            @PathVariable Long specId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(specService.getSpecVersions(specId, userDetails.getUsername()));
    }

    @GetMapping("/specs/{specId}/versions/{version}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','DEVELOPER','QA_TESTER','CLIENT','USER','ROLE_USER')")
    public ResponseEntity<SpecResponse> getSpecByVersion(
            @PathVariable Long specId,
            @PathVariable Integer version,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(specService.getSpecByVersion(specId, version, userDetails.getUsername()));
    }

    @PostMapping("/specs/{specId}/submit")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','USER','ROLE_USER')")
    public ResponseEntity<SpecResponse> submitForReview(
            @PathVariable Long specId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(specService.submitForReview(specId, userDetails.getUsername()));
    }

    @PostMapping("/specs/{specId}/approve")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','CLIENT','USER','ROLE_USER')")
    public ResponseEntity<SpecResponse> approveSpec(
            @PathVariable Long specId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(specService.approveSpec(specId, userDetails.getUsername()));
    }

    @PostMapping("/specs/{specId}/request-changes")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','ORG_ADMIN','SUPER_ADMIN','CLIENT','USER','ROLE_USER')")
    public ResponseEntity<SpecResponse> requestChanges(
            @PathVariable Long specId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String note = body != null ? body.get("note") : "";
        return ResponseEntity.ok(specService.requestChanges(specId, note, userDetails.getUsername()));
    }
}
