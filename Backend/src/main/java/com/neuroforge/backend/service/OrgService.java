package com.neuroforge.backend.service;

import com.neuroforge.backend.dto.*;
import com.neuroforge.backend.entity.*;
import com.neuroforge.backend.exception.DuplicateResourceException;
import com.neuroforge.backend.exception.InvalidRequestException;
import com.neuroforge.backend.exception.ResourceNotFoundException;
import com.neuroforge.backend.repository.*;
import com.neuroforge.backend.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrgService {

    private static final Logger log = LoggerFactory.getLogger(OrgService.class);

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


    //---Organization---

    public Organization createOrganization(CreateOrgRequest request) {
        Organization organization = new Organization();
        organization.setName(request.getName());
        organization.setDescription(request.getDescription());
        organization.setSupportEmail(request.getSupportEmail());
        organization.setCreatedAt(LocalDateTime.now());
        return organizationRepository.save(organization);
    }

    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    private User validateOrganizationAccess(Long orgId, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // SUPER_ADMIN can access every organization
        if (user.getRole() == Role.SUPER_ADMIN) {
            return user;
        }

        if (user.getOrganization() == null ||
                !user.getOrganization().getId().equals(orgId)) {

            throw new InvalidRequestException(
                    "You are not authorized to access this organization."
            );
        }
        return user;
    }

    // ---- Teams ----

    public List<TeamResponse> listTeams(Long orgId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        List<User> orgUsers = userRepository.findByOrganizationId(orgId);
        return teamRepository.findByOrganizationId(orgId).stream()
                .map(t -> {
                    int count = (int) orgUsers.stream()
                            .filter(u -> u.getTeams().stream().anyMatch(tm -> tm.getId().equals(t.getId())))
                            .count();
                    return new TeamResponse(t.getId(), t.getName(), count);
                })
                .toList();
    }

    @Transactional
    public TeamResponse createTeam(Long orgId, String name, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        // Remove leading/trailing spaces
        name = name.trim();

        // Team name should not be empty
        if (name.isBlank()) {
            throw new InvalidRequestException("Team name cannot be empty.");
        }

        // Prevent duplicate team names in the same organization
        if (teamRepository.existsByOrganizationIdAndNameIgnoreCase(orgId, name)) {
            throw new DuplicateResourceException(
                    "A team with this name already exists in the organization."
            );
        }
        Team team = teamRepository.save(new Team(name, org));
        return new TeamResponse(team.getId(), team.getName(), 0);
    }

    @Transactional
    public void deleteTeam(Long orgId, Long teamId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        if (!team.getOrganization().getId().equals(orgId))
            throw new InvalidRequestException("Team does not belong to this organization");
        if (!team.getUsers().isEmpty()) {
            throw new InvalidRequestException(
                    "Cannot delete a team that still has members."
            );
        }
        teamRepository.delete(team);
    }

    // ---- Members ----

    public List<MemberResponse> listMembers(Long orgId, String loggedInEmail) {

        validateOrganizationAccess(orgId, loggedInEmail);

        return userRepository.findByOrganizationId(orgId)
                .stream()
                .map(u -> new MemberResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getPhoneNumber(),
                        u.getRole(),
                        u.isEnabled(),
                        u.getCreatedAt(),
                        u.getTeams()
                                .stream()
                                .map(Team::getName)
                                .toList()
                ))
                .toList();
    }

    @Transactional
    public MemberResponse updateMemberRole(Long orgId, Long memberId, Role role,String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId))
            throw new InvalidRequestException("Member does not belong to this organization");
        if (role == Role.SUPER_ADMIN) {
            throw new InvalidRequestException(
                    "SUPER_ADMIN role cannot be assigned."
            );
        }
        user.setRole(role);
        userRepository.save(user);
        return new MemberResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt(),
                user.getTeams()
                        .stream()
                        .map(Team::getName)
                        .toList()
        );
    }

    @Transactional
    public void removeMember(Long orgId, Long memberId,String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId))
            throw new InvalidRequestException("Member does not belong to this organization");
        // Remove the user from all teams
        user.getTeams().clear();
        // Reset role
        user.setRole(Role.DEVELOPER);
        //remove from organization
        user.setOrganization(null);
        userRepository.save(user);
    }

    // ---- Invites ----

    private boolean isInviteExpired(Invite invite) {

        if (invite.getCreatedAt()
                .plusDays(7)
                .isBefore(LocalDateTime.now())) {
            if (invite.getStatus() != InviteStatus.EXPIRED) {
                invite.setStatus(InviteStatus.EXPIRED);
                inviteRepository.save(invite);
            }
            return true;
        }
        return false;
    }

    @Transactional
    public void inviteMember(Long orgId, InviteRequest request, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        inviteRepository.findByEmailAndOrganizationIdAndStatus(
                request.getEmail(),
                orgId,
                InviteStatus.PENDING
        ).ifPresent(invite -> {
            throw new DuplicateResourceException(
                    "A pending invitation already exists for this email."
            );
        });

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        if (!team.getOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("Selected team does not belong to this organization.");
        }

        String token = UUID.randomUUID().toString();
        Invite invite = new Invite(request.getEmail(), token, org, team,request.getRole());
        inviteRepository.save(invite);

        // TODO: replace with real email sender in production
        log.info("INVITE sent to org={} email=[redacted] token=[redacted]", orgId);
    }

    @Transactional
    public InvitePreviewResponse getInvitePreview(String token) {
        return inviteRepository.findByToken(token)
                .map(invite -> {
                    // Check if invite has expired
                    if (isInviteExpired(invite)) {
                        return new InvitePreviewResponse("This invitation has expired.");
                    }
                    if (invite.getStatus() != InviteStatus.PENDING) {
                        return new InvitePreviewResponse(
                                "This invite has already been used."
                        );
                    }
                    return new InvitePreviewResponse(
                            true,
                            invite.getRole(),
                            invite.getOrganization().getName(),
                            invite.getEmail()
                    );

                })
                .orElse(
                        new InvitePreviewResponse("This invite link is invalid.")
                );
    }

    @Transactional
    public AuthResponse acceptInvite(String token, String userEmail) {
        Invite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new InvalidRequestException("Invalid invite token"));

        if (isInviteExpired(invite)) {
            throw new InvalidRequestException("Invitation has expired.");
        }
        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new InvalidRequestException("Invite has already been used or expired.");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(invite.getEmail())) {
            throw new InvalidRequestException("This invite was sent to a different email.");
        }

        if (user.getOrganization() != null &&
                !user.getOrganization().getId().equals(invite.getOrganization().getId())) {
            throw new InvalidRequestException("User already belongs to another organization.");
        }

        user.setOrganization(invite.getOrganization());
        user.setRole(invite.getRole());

        boolean alreadyMember = user.getTeams().stream()
                .anyMatch(team -> team.getId().equals(invite.getTeam().getId()));
        if (!alreadyMember) {
            user.getTeams().add(invite.getTeam());
        }

        userRepository.save(user);
        invite.setStatus(InviteStatus.ACCEPTED);
        inviteRepository.save(invite);

        String jwtToken = jwtService.generateToken(user);
        Long orgId = user.getOrganization().getId();
        String orgName = user.getOrganization().getName();
        return new AuthResponse(jwtToken,
                new AuthResponse.UserPayload(
                        user.getId(), user.getEmail(), user.getFullName(), orgId, orgName, user.getRole()));
    }

    // ---- Org Settings ----

    public OrgSettingsRequest getOrgSettings(Long orgId,String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        OrgSettingsRequest dto = new OrgSettingsRequest();
        dto.setName(org.getName());
        dto.setDescription(org.getDescription());
        dto.setSupportEmail(org.getSupportEmail());
        return dto;
    }

    @Transactional
    public OrgSettingsRequest updateOrgSettings(Long orgId, OrgSettingsRequest request,String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        if (request.getName() != null) org.setName(request.getName());
        if (request.getDescription() != null) org.setDescription(request.getDescription());
        if (request.getSupportEmail() != null) org.setSupportEmail(request.getSupportEmail());
        organizationRepository.save(org);
        return request;
    }
}
