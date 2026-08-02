package com.neuroforge.service;

import com.neuroforge.dto.auth.AuthResponse;
import com.neuroforge.dto.organization.*;
import com.neuroforge.entity.*;
import com.neuroforge.enums.InviteStatus;
import com.neuroforge.enums.Role;
import com.neuroforge.exception.DuplicateResourceException;
import com.neuroforge.exception.InvalidRequestException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.*;
import com.neuroforge.security.JwtService;
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
    private final EmailService emailService;
    private final ActivityService activityService;

    public OrgService(OrganizationRepository organizationRepository,
                      TeamRepository teamRepository,
                      UserRepository userRepository,
                      InviteRepository inviteRepository,
                      JwtService jwtService,
                      EmailService emailService,
                      ActivityService activityService) {
        this.organizationRepository = organizationRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.inviteRepository = inviteRepository;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.activityService = activityService;
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

    @Transactional
    public void deleteOrganization(Long id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        // Unlink users from this organization
        List<User> orgUsers = userRepository.findByOrganizationId(id);
        for (User u : orgUsers) {
            u.setOrganization(null);
            userRepository.save(u);
        }

        // Delete teams belonging to this organization
        List<Team> teams = teamRepository.findByOrganizationId(id);
        teamRepository.deleteAll(teams);

        organizationRepository.delete(org);
    }

    @Transactional
    public OrgAdminResponse assignOrgAdmin(Long orgId, Long userId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (targetUser.getRole() == Role.SUPER_ADMIN) {
            throw new InvalidRequestException("SUPER_ADMIN user cannot be assigned as Org Admin.");
        }

        // Check if organization already has an ORG_ADMIN
        List<User> existingOrgUsers = userRepository.findByOrganizationId(orgId);
        boolean hasOrgAdmin = existingOrgUsers.stream()
                .anyMatch(u -> u.getRole() == Role.ORG_ADMIN && !u.getId().equals(userId));

        if (hasOrgAdmin) {
            throw new InvalidRequestException("This organization already has an Org Admin assigned. Only 1 Org Admin per organization is allowed.");
        }

        // Link user to organization and set role to ORG_ADMIN
        targetUser.setOrganization(org);
        targetUser.setRole(Role.ORG_ADMIN);
        User savedUser = userRepository.save(targetUser);

        return new OrgAdminResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhoneNumber(),
                savedUser.getRole(),
                savedUser.isEnabled(),
                savedUser.getCreatedAt()
        );
    }

    @Transactional
    public void removeOrgAdmin(Long orgId, Long userId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (targetUser.getOrganization() == null || !targetUser.getOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("User does not belong to this organization.");
        }

        if (targetUser.getRole() != Role.ORG_ADMIN) {
            throw new InvalidRequestException("User is not an Org Admin.");
        }

        // Demote role to DEVELOPER and unlink from organization
        targetUser.setRole(Role.DEVELOPER);
        targetUser.getTeams().clear();
        targetUser.setOrganization(null);
        userRepository.save(targetUser);
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

    @Transactional(readOnly = true)
    public TeamDetailResponse getTeamDetails(Long orgId, Long teamId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        if (!team.getOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("Team does not belong to this organization");
        }
        
        List<User> orgUsers = userRepository.findByOrganizationId(orgId);
        List<MemberResponse> teamMembers = orgUsers.stream()
                .filter(u -> u.getTeams().stream().anyMatch(tm -> tm.getId().equals(team.getId())))
                .map(u -> new MemberResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getPhoneNumber(),
                        u.getRole(),
                        u.isEnabled(),
                        u.getCreatedAt(),
                        u.getTeams().stream().map(Team::getName).toList()
                ))
                .toList();

        TeamDetailResponse dto = new TeamDetailResponse();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setDescription(team.getDescription());
        dto.setLeadId(team.getLead() != null ? team.getLead().getId() : null);
        dto.setLeadName(team.getLead() != null ? team.getLead().getFullName() : null);
        dto.setCreatedAt(team.getCreatedAt());
        dto.setUpdatedAt(team.getUpdatedAt());
        dto.setMemberCount(teamMembers.size());
        dto.setMembers(teamMembers);
        return dto;
    }

    @Transactional
    public TeamDetailResponse updateTeam(Long orgId, Long teamId, UpdateTeamRequest request, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        if (!team.getOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("Team does not belong to this organization");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            if (!team.getName().equalsIgnoreCase(request.getName()) &&
                teamRepository.existsByOrganizationIdAndNameIgnoreCase(orgId, request.getName().trim())) {
                throw new DuplicateResourceException("A team with this name already exists.");
            }
            team.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            team.setDescription(request.getDescription().trim());
        }

        if (request.getLeadId() != null) {
            User lead = userRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead user not found"));
            if (lead.getOrganization() == null || !lead.getOrganization().getId().equals(orgId)) {
                throw new InvalidRequestException("Lead user must belong to the organization.");
            }
            team.setLead(lead);
        } else {
            team.setLead(null);
        }

        team = teamRepository.save(team);
        
        activityService.logActivity(orgId, "Team updated", "Updated team: " + team.getName(), loggedInEmail);
        
        return getTeamDetails(orgId, team.getId(), loggedInEmail);
    }

    @Transactional(readOnly = true)
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

        List<User> teamMembers = userRepository.findByTeamsId(teamId);
        teamMembers.forEach(u -> {
            u.getTeams().removeIf(t -> t.getId().equals(teamId));
            userRepository.save(u);
        });

        String teamName = team.getName();
        teamRepository.delete(team);
        
        activityService.logActivity(orgId, "Team deleted", "Deleted team: " + teamName, loggedInEmail);
    }

    // ---- Members ----

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(Long orgId, String loggedInEmail) {

        validateOrganizationAccess(orgId, loggedInEmail);

        return userRepository.findByOrganizationId(orgId)
                .stream()
                .filter(u -> u.getRole() != Role.SUPER_ADMIN)
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
        if (role == Role.SUPER_ADMIN || role == Role.ORG_ADMIN) {
            throw new InvalidRequestException(
                    "SUPER_ADMIN or ORG_ADMIN roles cannot be assigned via this endpoint."
            );
        }
        if (user.getRole() == Role.ORG_ADMIN) {
            throw new InvalidRequestException("You cannot change the role of an Organization Admin via this endpoint.");
        }
        if (user.getEmail().equals(loggedInEmail)) {
            throw new InvalidRequestException("You cannot change your own role.");
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
        if (user.getEmail().equals(loggedInEmail)) {
            throw new InvalidRequestException("You cannot remove yourself from the organization.");
        }
        if (user.getRole() == Role.ORG_ADMIN) {
            throw new InvalidRequestException("Organization Admins cannot be removed via this endpoint.");
        }
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

        Team team = null;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
            if (!team.getOrganization().getId().equals(orgId)) {
                throw new InvalidRequestException("Selected team does not belong to this organization.");
            }
        }

        String token = UUID.randomUUID().toString();
        Invite invite = new Invite(request.getEmail(), token, org, team, request.getRole());
        inviteRepository.save(invite);

        emailService.sendInviteEmail(request.getEmail(), token, org.getName(), request.getRole().name());
        log.info("INVITE successfully dispatched to org={} email=[redacted]", orgId);
        
        activityService.logActivity(orgId, "Member invited", "Invited " + request.getEmail() + " as " + request.getRole(), loggedInEmail);
    }

    @Transactional(readOnly = true)
    public List<InviteResponse> listPendingInvites(Long orgId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        return inviteRepository.findByOrganizationId(orgId).stream()
                .filter(i -> i.getStatus() == InviteStatus.PENDING)
                .map(i -> new InviteResponse(
                        i.getId(),
                        i.getEmail(),
                        i.getRole(),
                        i.getStatus(),
                        i.getCreatedAt(),
                        i.getCreatedAt().plusDays(7)
                ))
                .toList();
    }

    @Transactional
    public void cancelInvite(Long orgId, Long inviteId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Invite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found"));
        if (!invite.getOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("Invite does not belong to this organization.");
        }
        inviteRepository.delete(invite);
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

        if (invite.getTeam() != null) {
            boolean alreadyMember = user.getTeams().stream()
                    .anyMatch(team -> team.getId().equals(invite.getTeam().getId()));
            if (!alreadyMember) {
                user.getTeams().add(invite.getTeam());
            }
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
