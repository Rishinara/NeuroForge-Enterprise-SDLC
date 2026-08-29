package com.neuroforge.controller;

import com.neuroforge.dto.snapshot.BurndownResponse;
import com.neuroforge.dto.sprint.CreateSprintRequest;
import com.neuroforge.dto.sprint.SprintResponse;
import com.neuroforge.dto.sprint.UpdateSprintRequest;
import com.neuroforge.dto.sprintsummary.SprintSummaryResponse;
import com.neuroforge.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN')")
    public SprintResponse createSprint(
            @Valid @RequestBody CreateSprintRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return sprintService.createSprint(request, userDetails.getUsername());
    }

    @PutMapping("/{sprintId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN')")
    public SprintResponse updateSprint(
            @PathVariable Long sprintId,
            @Valid @RequestBody UpdateSprintRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return sprintService.updateSprint(
                sprintId,
                request,
                userDetails.getUsername());
    }

    @DeleteMapping("/{sprintId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN')")
    public void deleteSprint(
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails userDetails) {

        sprintService.deleteSprint(
                sprintId,
                userDetails.getUsername());
    }

    @GetMapping("/{sprintId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'DEVELOPER', 'FRONTEND_DEVELOPER', 'BACKEND_DEVELOPER', 'QA_TESTER', 'CLIENT', 'ORG_ADMIN')")
    public SprintResponse getSprintById(
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return sprintService.getSprintById(
                sprintId,
                userDetails.getUsername());
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'DEVELOPER', 'FRONTEND_DEVELOPER', 'BACKEND_DEVELOPER', 'QA_TESTER', 'CLIENT', 'ORG_ADMIN')")
    public List<SprintResponse> getProjectSprints(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return sprintService.getProjectSprints(
                projectId,
                userDetails.getUsername());
    }

    @PostMapping("/{sprintId}/start")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN')")
    public SprintResponse startSprint(
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return sprintService.startSprint(
                sprintId,
                userDetails.getUsername());
    }

    @PostMapping("/{sprintId}/complete")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN')")
    public SprintSummaryResponse completeSprint(
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return sprintService.completeSprint(
                sprintId,
                userDetails.getUsername());
    }

    @PostMapping("/{sprintId}/snapshot")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER','SUPER_ADMIN')")
    public void captureStoryPointSnapshot(
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails userDetails) {

        sprintService.captureStoryPointSnapshot(
                sprintId,
                userDetails.getUsername());
    }

    @GetMapping("/{sprintId}/burndown")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'DEVELOPER', 'FRONTEND_DEVELOPER', 'BACKEND_DEVELOPER', 'QA_TESTER', 'CLIENT', 'ORG_ADMIN')")
    public BurndownResponse getBurndown(
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return sprintService.getBurndown(
                sprintId,
                userDetails.getUsername());
    }

}