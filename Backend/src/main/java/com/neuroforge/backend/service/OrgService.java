package com.neuroforge.backend.service;

import com.neuroforge.backend.dto.*;
import com.neuroforge.backend.entity.*;
import com.neuroforge.backend.exception.InvalidRequestException;
import com.neuroforge.backend.exception.ResourceNotFoundException;
import com.neuroforge.backend.repository.*;
import com.neuroforge.backend.security.JwtService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrgService {

    private final OrganizationRepository organizationRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final InviteRepository inviteRepository;
    private final JwtService jwtService;

    public OrgService(OrganizationRepository organizationRepository,
                      TeamRepository teamRepository,
                      UserRepository userRepository,
                      InviteRepository inviteRepository,
                      JwtService jwtService) {
        this.organizationRepository = organizationRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.inviteRepository = inviteRepository;
        this.jwtService = jwtService;
    }

    // ---- Teams ----

    public List<TeamResponse> listTeams(Long orgId) {
        return teamRepository.findByOrganizationId(orgId).stream()
                .map(t -> new TeamResponse(t.getId(), t.getName(),
                        (int) userRepository.findByOrganizationId(orgId).stream()
                                .filter(u -> u.getTeams().stream().anyMatch(tm -> tm.getId().equals(t.getId())))
                                .count()))
                .toList();
    }

    public TeamResponse createTeam(Long orgId, String name) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        Team team = teamRepository.save(new Team(name, org));
        return new TeamResponse(team.getId(), team.getName(), 0);
    }

    public void deleteTeam(Long orgId, Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        if (!team.getOrganization().getId().equals(orgId))
            throw new InvalidRequestException("Team does not belong to this organization");
        teamRepository.delete(team);
    }

    // ---- Members ----

    public List<MemberResponse> listMembers(Long orgId) {
        return userRepository.findByOrganizationId(orgId).stream()
                .map(u -> new MemberResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole()))
                .toList();
    }

    @Transactional
    public MemberResponse updateMemberRole(Long orgId, Long memberId, Role role) {
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId))
            throw new InvalidRequestException("Member does not belong to this organization");
        user.setRole(role);
        userRepository.save(user);
        return new MemberResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
    }

    @Transactional
    public void removeMember(Long orgId, Long memberId) {
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId))
            throw new InvalidRequestException("Member does not belong to this organization");
        user.setOrganization(null);
        userRepository.save(user);
    }

    // ---- Invites ----

    public void inviteMember(Long orgId, InviteRequest request, String inviterEmail) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        String token = UUID.randomUUID().toString();
        Invite invite = new Invite(request.getEmail(), token, org, request.getRole());
        inviteRepository.save(invite);

        String link = "http://localhost:5173/invite/" + token;
        System.out.println("=== INVITE EMAIL TO: " + request.getEmail() + " LINK: " + link + " ===");
    }

    public InvitePreviewResponse getInvitePreview(String token) {
        return inviteRepository.findByToken(token)
                .map(invite -> {
                    if (!"PENDING".equals(invite.getStatus()))
                        return new InvitePreviewResponse("This invite has already been used or expired.");
                    return new InvitePreviewResponse(true, invite.getRole(),
                            invite.getOrganization().getName(), invite.getEmail());
                })
                .orElse(new InvitePreviewResponse("This invite link is invalid or has expired."));
    }

    @Transactional
    public AuthResponse acceptInvite(String token, String userEmail) {
        Invite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new InvalidRequestException("Invalid invite token"));

        if (!"PENDING".equals(invite.getStatus()))
            throw new InvalidRequestException("Invite has already been used or expired.");

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(invite.getEmail()))
            throw new InvalidRequestException("This invite was sent to a different email.");

        user.setOrganization(invite.getOrganization());
        user.setRole(invite.getRole());
        userRepository.save(user);

        invite.setStatus("ACCEPTED");
        inviteRepository.save(invite);

        String jwtToken = jwtService.generateToken(user);
        Long orgId = user.getOrganization().getId();
        String orgName = user.getOrganization().getName();
        return new AuthResponse(jwtToken,
                new AuthResponse.UserPayload(user.getId(), user.getEmail(), user.getFullName(), orgId, orgName, user.getRole()));
    }

    // ---- Org Settings ----

    public OrgSettingsRequest getOrgSettings(Long orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        OrgSettingsRequest dto = new OrgSettingsRequest();
        dto.setName(org.getName());
        dto.setDescription(org.getDescription());
        dto.setSupportEmail(org.getSupportEmail());
        return dto;
    }

    @Transactional
    public OrgSettingsRequest updateOrgSettings(Long orgId, OrgSettingsRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        if (request.getName() != null) org.setName(request.getName());
        if (request.getDescription() != null) org.setDescription(request.getDescription());
        if (request.getSupportEmail() != null) org.setSupportEmail(request.getSupportEmail());
        organizationRepository.save(org);
        return request;
    }
}
