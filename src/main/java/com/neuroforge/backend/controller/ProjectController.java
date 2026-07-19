package com.neuroforge.backend.controller;

import com.neuroforge.backend.dto.CreateProjectRequest;
import com.neuroforge.backend.dto.ProjectResponse;
import com.neuroforge.backend.entity.ProjectHealthSnapshot;
import com.neuroforge.backend.entity.Role;
import com.neuroforge.backend.entity.User;
import com.neuroforge.backend.repository.UserRepository;
import com.neuroforge.backend.service.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProjectController {

    private final ProjectService projectService;
    private final UserRepository userRepository;

    public ProjectController(ProjectService projectService, UserRepository userRepository) {
        this.projectService = projectService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new RuntimeException("Unauthorized user context");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user details not found"));
    }

    @PostMapping("/orgs/{orgId}/projects")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN')")
    public ResponseEntity<ProjectResponse> createProject(
            @PathVariable Long orgId,
            @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getAuthenticatedUser(userDetails);

        // Ensure Project Manager belongs to the organization they are creating the project for
        if (currentUser.getRole() == Role.PROJECT_MANAGER && 
            (currentUser.getOrganization() == null || !currentUser.getOrganization().getId().equals(orgId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        ProjectResponse response = projectService.createProject(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/orgs/{orgId}/projects")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'QA_TESTER', 'CLIENT', 'SUPER_ADMIN')")
    public ResponseEntity<List<ProjectResponse>> getProjects(
            @PathVariable Long orgId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getAuthenticatedUser(userDetails);

        // Access control: Ensure user belongs to the requested organization (unless they are Super Admin)
        if (currentUser.getRole() != Role.SUPER_ADMIN && 
            (currentUser.getOrganization() == null || !currentUser.getOrganization().getId().equals(orgId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ProjectResponse> response = projectService.getProjectsByOrg(orgId, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/projects/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectResponse> getProjectDetails(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getAuthenticatedUser(userDetails);
        ProjectResponse project = projectService.getProjectDetails(projectId);

        // Access control check:
        // Super Admins see all. Org Admins/PMs of the same org see all.
        // Other roles (DEV/QA/CL) must be assigned as members of the project.
        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            boolean isOrgAdminOrPmOfSameOrg = (currentUser.getRole() == Role.ORG_ADMIN || currentUser.getRole() == Role.PROJECT_MANAGER) 
                    && currentUser.getOrganization() != null 
                    && currentUser.getOrganization().getId().equals(project.getOrgId());

            boolean isAssignedMember = project.getMembers().stream()
                    .anyMatch(m -> m.getId().equals(currentUser.getId()));

            if (!isOrgAdminOrPmOfSameOrg && !isAssignedMember) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        return ResponseEntity.ok(project);
    }

    @PatchMapping("/projects/{projectId}/milestones/{milestoneId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'DEVELOPER', 'SUPER_ADMIN')")
    public ResponseEntity<ProjectResponse> toggleMilestone(
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @RequestParam boolean completed,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getAuthenticatedUser(userDetails);
        ProjectResponse project = projectService.getProjectDetails(projectId);

        // Access control check:
        // PMs must belong to the organization. Developers must be assigned members of the project.
        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            if (currentUser.getRole() == Role.PROJECT_MANAGER) {
                if (currentUser.getOrganization() == null || !currentUser.getOrganization().getId().equals(project.getOrgId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            } else if (currentUser.getRole() == Role.DEVELOPER) {
                boolean isAssignedMember = project.getMembers().stream()
                        .anyMatch(m -> m.getId().equals(currentUser.getId()));
                if (!isAssignedMember) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }
        }

        ProjectResponse updatedProject = projectService.toggleMilestone(projectId, milestoneId, completed);
        return ResponseEntity.ok(updatedProject);
    }

    @GetMapping("/projects/{projectId}/snapshots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectHealthSnapshot>> getProjectSnapshots(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = getAuthenticatedUser(userDetails);
        ProjectResponse project = projectService.getProjectDetails(projectId);

        // Access control check: Same as getProjectDetails
        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            boolean isOrgAdminOrPmOfSameOrg = (currentUser.getRole() == Role.ORG_ADMIN || currentUser.getRole() == Role.PROJECT_MANAGER) 
                    && currentUser.getOrganization() != null 
                    && currentUser.getOrganization().getId().equals(project.getOrgId());

            boolean isAssignedMember = project.getMembers().stream()
                    .anyMatch(m -> m.getId().equals(currentUser.getId()));

            if (!isOrgAdminOrPmOfSameOrg && !isAssignedMember) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        List<ProjectHealthSnapshot> snapshots = projectService.getProjectHealthHistory(projectId);
        return ResponseEntity.ok(snapshots);
    }
}
