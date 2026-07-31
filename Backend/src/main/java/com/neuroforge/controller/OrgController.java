package com.neuroforge.controller;

import com.neuroforge.dto.auth.AuthResponse;
import com.neuroforge.dto.organization.*;
import com.neuroforge.entity.Organization;
import com.neuroforge.service.OrgService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class OrgController {

    private final OrgService orgService;

    public OrgController(OrgService orgService) {
        this.orgService = orgService;
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/api/organizations")
    public OrgResponse createOrganization(@Valid @RequestBody CreateOrgRequest request) {
        return orgService.createOrganization(request);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/organizations")
    public List<OrgResponse> getAllOrganizations() {
        return orgService.getAllOrganizations();
    }

    // ---- Teams ----

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    @PostMapping("/api/orgs/{orgId}/teams")
    public TeamResponse createTeam(
            @PathVariable Long orgId,
            @Valid @RequestBody TeamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return orgService.createTeam(orgId, request.getName(), userDetails.getUsername());
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/orgs/{orgId}/teams")
    public List<TeamResponse> listTeams(
            @PathVariable Long orgId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return orgService.listTeams(orgId, userDetails.getUsername());
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    @DeleteMapping("/api/orgs/{orgId}/teams/{teamId}")
    public ResponseEntity<Void> deleteTeam(
            @PathVariable Long orgId,
            @PathVariable Long teamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        orgService.deleteTeam(orgId, teamId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ---- Members ----

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER')")
    @GetMapping("/api/orgs/{orgId}/members")
    public List<MemberResponse> listMembers(
            @PathVariable Long orgId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return orgService.listMembers(orgId, userDetails.getUsername());
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    @PutMapping("/api/orgs/{orgId}/members/{memberId}/role")
    public MemberResponse updateMemberRole(
            @PathVariable Long orgId,
            @PathVariable Long memberId,
            @RequestBody UpdateMemberRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return orgService.updateMemberRole(orgId, memberId, request.getRole(), userDetails.getUsername());
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    @DeleteMapping("/api/orgs/{orgId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long orgId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal UserDetails userDetails) {
        orgService.removeMember(orgId, memberId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ---- Invites ----

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN','PROJECT_MANAGER')")
    @PostMapping("/api/orgs/{orgId}/invites")
    public ResponseEntity<Void> inviteMember(
            @PathVariable Long orgId,
            @Valid @RequestBody InviteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        orgService.inviteMember(orgId, request, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/invites/{token}")
    public InvitePreviewResponse getInvitePreview(@PathVariable String token) {
        return orgService.getInvitePreview(token);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/api/invites/{token}/accept")
    public AuthResponse acceptInvite(
            @PathVariable String token,
            @AuthenticationPrincipal UserDetails userDetails) {
        return orgService.acceptInvite(token, userDetails.getUsername());
    }

    // ---- Org Settings ----

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    @GetMapping("/api/orgs/{orgId}/settings")
    public OrgSettingsRequest getOrgSettings(
            @PathVariable Long orgId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return orgService.getOrgSettings(orgId, userDetails.getUsername());
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    @PutMapping("/api/orgs/{orgId}/settings")
    public OrgSettingsRequest updateOrgSettings(
            @PathVariable Long orgId,
            @RequestBody OrgSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return orgService.updateOrgSettings(orgId, request, userDetails.getUsername());
    }
}
