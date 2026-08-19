package com.neuroforge.controller;

import com.neuroforge.dto.bug.BugRequest;
import com.neuroforge.dto.bug.BugResponse;
import com.neuroforge.service.BugService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/bugs")
@RequiredArgsConstructor
public class BugController {

    private final BugService bugService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'QA_TESTER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public BugResponse createBug(
            @PathVariable Long projectId,
            @Valid @RequestBody BugRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
            
        request.setProjectId(projectId);
        return bugService.createBug(request, userDetails.getUsername());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'QA_TESTER', 'DEVELOPER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public List<BugResponse> getBugs(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return bugService.getBugsByProject(projectId, userDetails.getUsername());
    }

    @PutMapping("/{bugId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'QA_TESTER', 'DEVELOPER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public BugResponse updateBug(
            @PathVariable Long projectId,
            @PathVariable Long bugId,
            @Valid @RequestBody BugRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        request.setProjectId(projectId);
        return bugService.updateBug(bugId, request, userDetails.getUsername());
    }

    @DeleteMapping("/{bugId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('QA_TESTER', 'SUPER_ADMIN')")
    public void deleteBug(
            @PathVariable Long projectId,
            @PathVariable Long bugId,
            @AuthenticationPrincipal UserDetails userDetails) {

        bugService.deleteBug(bugId, userDetails.getUsername());
    }
}
