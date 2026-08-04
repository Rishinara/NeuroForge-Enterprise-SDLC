package com.neuroforge.controller;

import com.neuroforge.dto.milestone.MilestoneRequest;
import com.neuroforge.dto.milestone.MilestoneResponse;
import com.neuroforge.service.MilestoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public MilestoneResponse createMilestone(
            @PathVariable Long projectId,
            @Valid @RequestBody MilestoneRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
            
        request.setProjectId(projectId);
        return milestoneService.createMilestone(request, userDetails.getUsername());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'QA_TESTER', 'DEVELOPER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public List<MilestoneResponse> getMilestones(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return milestoneService.getMilestonesByProject(projectId, userDetails.getUsername());
    }

    @PutMapping("/{milestoneId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public MilestoneResponse updateMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @Valid @RequestBody MilestoneRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        request.setProjectId(projectId);
        return milestoneService.updateMilestone(milestoneId, request, userDetails.getUsername());
    }

    @DeleteMapping("/{milestoneId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public void deleteMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @AuthenticationPrincipal UserDetails userDetails) {

        milestoneService.deleteMilestone(milestoneId, userDetails.getUsername());
    }
}
