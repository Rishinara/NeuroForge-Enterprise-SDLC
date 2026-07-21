package com.neuroforge.backend.controller;

import com.neuroforge.backend.dto.CreateInviteRequest;
import com.neuroforge.backend.dto.CreateOrgRequest;
import com.neuroforge.backend.dto.CreateTeamRequest;
import com.neuroforge.backend.entity.Organization;
import com.neuroforge.backend.entity.Team;
import com.neuroforge.backend.service.InviteService;
import com.neuroforge.backend.service.OrganizationService;
import com.neuroforge.backend.service.TeamService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class OrgWorkspaceController {

    private final OrganizationService organizationService;
    private final TeamService teamService;
    private final InviteService inviteService;

    public OrgWorkspaceController(OrganizationService organizationService,
                                  TeamService teamService,
                                  InviteService inviteService) {
        this.organizationService = organizationService;
        this.teamService = teamService;
        this.inviteService = inviteService;
    }

    @PostMapping("/api/organizations")
    public Organization createOrganization(@RequestBody CreateOrgRequest request) {
        return organizationService.createOrganization(request.getName());
    }

    @GetMapping("/api/organizations")
    public List<Organization> getAllOrganizations() {
        return organizationService.getAllOrganizations();
    }

    @PostMapping("/api/orgs/{orgId}/teams")
    public Team createTeam(@PathVariable Long orgId, @RequestBody CreateTeamRequest request) {
        return teamService.createTeam(orgId, request.getName());
    }

    @GetMapping("/api/orgs/{orgId}/teams")
    public List<Team> getTeamsByOrg(@PathVariable Long orgId) {
        return teamService.getTeamsByOrg(orgId);
    }

    @PostMapping("/api/orgs/{orgId}/invites")
    public String createInvite(@PathVariable Long orgId, @RequestBody CreateInviteRequest request) {
        return inviteService.createInvite(orgId, request.getEmail(), request.getTeamId(), request.getRole());
    }
}
