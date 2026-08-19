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

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER','DEVELOPER','QA_TESTER','CLIENT')")
    @GetMapping("/orgs/{organizationId}/projects")
    public ResponseEntity<List<ProjectResponse>> getProjectsByOrganization(
            @PathVariable Long organizationId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {

        return ResponseEntity.ok(
                projectService.getProjectsByOrganization(organizationId, userDetails.getUsername())
        );
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER','DEVELOPER','QA_TESTER','CLIENT')")
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

    // Temporary endpoint until Milestone module is implemented
    @PreAuthorize("hasRole('ORG_ADMIN')")
    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }


    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER','CLIENT','DEVELOPER','QA_TESTER')")
    @GetMapping("/projects/{projectId}/progress")
    public ResponseEntity<com.neuroforge.dto.project.ProjectProgressResponse> getProjectProgress(
            @PathVariable Long projectId) {
        
        return ResponseEntity.ok(projectService.getProjectProgress(projectId));
    }

    @PreAuthorize("hasRole('ORG_ADMIN')")
    @PutMapping("/projects/{projectId}/members/{userId}/role")
    public ResponseEntity<Void> updateProjectMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @RequestBody com.neuroforge.dto.project.UpdateProjectRoleRequest request) {

        projectService.updateProjectMemberRole(projectId, userId, request.getRole());
        return ResponseEntity.ok().build();
    }
}
