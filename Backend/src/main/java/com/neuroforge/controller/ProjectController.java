package com.neuroforge.controller;

import com.neuroforge.dto.project.CreateProjectRequest;
import com.neuroforge.dto.project.ProjectResponse;
import com.neuroforge.dto.project.UpdateProjectRequest;
import com.neuroforge.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER')")
    @PostMapping("/projects")
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request) {

        ProjectResponse response = projectService.createProject(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/orgs/{organizationId}/projects")
    public ResponseEntity<List<ProjectResponse>> getProjectsByOrganization(
            @PathVariable Long organizationId) {

        return ResponseEntity.ok(
                projectService.getProjectsByOrganization(organizationId)
        );
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER','DEVELOPER','QA_TESTER')")
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable Long projectId) {

        return ResponseEntity.ok(
                projectService.getProject(projectId)
        );
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER')")
    @PutMapping("/projects/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateProjectRequest request) {

        return ResponseEntity.ok(
                projectService.updateProject(projectId, request)
        );
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER')")
    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        projectService.deleteProject(projectId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/projects")
    public ResponseEntity<List<ProjectResponse>> getProjects(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                projectService.getProjectsForUser(userDetails.getUsername())
        );
    }

    // Temporary endpoint until Milestone module is implemented
    @GetMapping("/projects/{projectId}/milestones")
    public ResponseEntity<List<Object>> getMilestones(
            @PathVariable Long projectId) {

        return ResponseEntity.ok(List.of());
    }
}
