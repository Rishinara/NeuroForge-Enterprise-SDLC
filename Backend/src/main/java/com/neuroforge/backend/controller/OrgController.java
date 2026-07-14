package com.neuroforge.backend.controller;

import com.neuroforge.backend.dto.*;
import com.neuroforge.backend.service.OrgService;
import jakarta.validation.Valid;
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

    // ---- Teams ----

    @GetMapping("/api/orgs/{orgId}/teams")
    public List<TeamResponse> listTeams(@PathVariable Long orgId) {
        return orgService.listTeams(orgId);
    }

    @PostMapping("/api/orgs/{orgId}/teams")
    public TeamResponse createTeam(@PathVariable Long orgId, @Valid @RequestBody TeamRequest request) {
        return orgService.createTeam(orgId, request.getName());
    }

    @DeleteMapping("/api/orgs/{orgId}/teams/{teamId}")
    public void deleteTeam(@PathVariable Long orgId, @PathVariable Long teamId) {
        orgService.deleteTeam(orgId, teamId);
    }

    // ---- Members ----

    @GetMapping("/api/orgs/{orgId}/members")
    public List<MemberResponse> listMembers(@PathVariable Long orgId) {
        return orgService.listMembers(orgId);
    }

    @PutMapping("/api/orgs/{orgId}/members/{memberId}/role")
    public MemberResponse updateMemberRole(@PathVariable Long orgId,
                                           @PathVariable Long memberId,
                                           @RequestBody UpdateMemberRoleRequest request) {
        return orgService.updateMemberRole(orgId, memberId, request.getRole());
    }

    @DeleteMapping("/api/orgs/{orgId}/members/{memberId}")
    public void removeMember(@PathVariable Long orgId, @PathVariable Long memberId) {
        orgService.removeMember(orgId, memberId);
    }

    // ---- Invites ----

    @PostMapping("/api/orgs/{orgId}/invites")
    public void inviteMember(@PathVariable Long orgId,
                             @Valid @RequestBody InviteRequest request,
                             @AuthenticationPrincipal UserDetails userDetails) {
        orgService.inviteMember(orgId, request, userDetails.getUsername());
    }

    @GetMapping("/api/invites/{token}")
    public InvitePreviewResponse getInvitePreview(@PathVariable String token) {
        return orgService.getInvitePreview(token);
    }

    @PostMapping("/api/invites/{token}/accept")
    public AuthResponse acceptInvite(@PathVariable String token,
                                     @AuthenticationPrincipal UserDetails userDetails) {
        return orgService.acceptInvite(token, userDetails.getUsername());
    }

    // ---- Org Settings ----

    @GetMapping("/api/orgs/{orgId}/settings")
    public OrgSettingsRequest getOrgSettings(@PathVariable Long orgId) {
        return orgService.getOrgSettings(orgId);
    }

    @PutMapping("/api/orgs/{orgId}/settings")
    public OrgSettingsRequest updateOrgSettings(@PathVariable Long orgId,
                                                @RequestBody OrgSettingsRequest request) {
        return orgService.updateOrgSettings(orgId, request);
    }
}
