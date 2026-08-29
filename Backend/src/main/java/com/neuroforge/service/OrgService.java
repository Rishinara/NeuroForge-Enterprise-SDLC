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
import com.neuroforge.repository.ProjectRepository;
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
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    private final ProjectMemberRepository projectMemberRepository;

    public OrgService(OrganizationRepository organizationRepository,
                      TeamRepository teamRepository,
                      UserRepository userRepository,
                      InviteRepository inviteRepository,
                      JwtService jwtService,
                      EmailService emailService,
                      ActivityService activityService,
                      ProjectRepository projectRepository,
                      NotificationService notificationService,
                      ProjectMemberRepository projectMemberRepository) {
        this.organizationRepository = organizationRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.inviteRepository = inviteRepository;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.activityService = activityService;
        this.projectRepository = projectRepository;
        this.notificationService = notificationService;
        this.projectMemberRepository = projectMemberRepository;
    }

    @Transactional
    public void ensureDefaultTeams(Organization org) {
        if (org == null || org.getId() == null) return;
        List<Team> existingTeams = teamRepository.findByOrganizationId(org.getId());
        java.util.Set<String> existingNames = existingTeams.stream()
                .map(t -> t.getName().toLowerCase())
                .collect(java.util.stream.Collectors.toSet());

        List<String> defaultTeamNames = List.of(
                "Frontend Developers",
                "Backend Developers",
                "Fullstack Developers",
                "QA Testers",
                "Client",
                "Project Manager"
        );

        List<Team> toSave = new java.util.ArrayList<>();
        for (String name : defaultTeamNames) {
            if (!existingNames.contains(name.toLowerCase())) {
                toSave.add(new Team(name, org));
            }
        }
        if (!toSave.isEmpty()) {
            teamRepository.saveAll(toSave);
        }
    }

    private String getDefaultTeamNameForRole(Role role) {
        if (role == null) return null;
        String r = role.name();
        if ("FRONTEND_DEVELOPER".equalsIgnoreCase(r)) {
            return "Frontend Developers";
        }
        if ("DEVELOPER".equalsIgnoreCase(r)) {
            return "Fullstack Developers";
        }
        if ("BACKEND_DEVELOPER".equalsIgnoreCase(r)) {
            return "Backend Developers";
        }
        if ("QA_TESTER".equalsIgnoreCase(r) || "QA".equalsIgnoreCase(r)) {
            return "QA Testers";
        }
        if ("CLIENT".equalsIgnoreCase(r)) {
            return "Client";
        }
        if ("PROJECT_MANAGER".equalsIgnoreCase(r)) {
            return "Project Manager";
        }
        return null;
    }

    private boolean isUserInTeam(User u, String teamName, Long teamId) {
        if (u == null) return false;
        if (u.getTeams() != null && u.getTeams().stream().anyMatch(tm -> 
                (tm.getId() != null && tm.getId().equals(teamId)) || 
                (tm.getName() != null && teamName != null && tm.getName().equalsIgnoreCase(teamName)))) {
            return true;
        }
        String defaultTeam = getDefaultTeamNameForRole(u.getRole());
        return defaultTeam != null && teamName != null && defaultTeam.equalsIgnoreCase(teamName);
    }

    @Transactional
    public void assignUserToDefaultTeam(User user, Organization org) {
        if (user == null || org == null) return;
        ensureDefaultTeams(org);
        String targetTeamName = getDefaultTeamNameForRole(user.getRole());

        if (targetTeamName != null) {
            String finalName = targetTeamName;
            teamRepository.findByOrganizationId(org.getId()).stream()
                    .filter(t -> t.getName().equalsIgnoreCase(finalName))
                    .findFirst()
                    .ifPresent(team -> {
                        boolean alreadyMember = user.getTeams().stream()
                                .anyMatch(t -> t.getId().equals(team.getId()));
                        if (!alreadyMember) {
                            user.getTeams().add(team);
                            userRepository.save(user);
                        }
                    });
        }
    }

    //---Organization---

    @Transactional
    public Organization createOrganization(CreateOrgRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new InvalidRequestException("Organization name cannot be empty.");
        }
        String cleanName = request.getName().trim();
        if (organizationRepository.existsByNameIgnoreCase(cleanName)) {
            throw new DuplicateResourceException("An organization with the name '" + cleanName + "' already exists.");
        }
        Organization organization = new Organization();
        organization.setName(cleanName);
        organization.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        organization.setSupportEmail(request.getSupportEmail() != null ? request.getSupportEmail().trim() : null);
        organization.setCreatedAt(LocalDateTime.now());

        Organization saved;
        try {
            saved = organizationRepository.save(organization);
            ensureDefaultTeams(saved);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.error("DataIntegrityViolationException creating organization {}: {}", cleanName, ex.getMessage(), ex);
            String specificCause = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
            if (specificCause != null && (specificCause.toLowerCase().contains("organizations_name") || specificCause.toLowerCase().contains("name_key") || specificCause.toLowerCase().contains("duplicate key"))) {
                if (organizationRepository.existsByNameIgnoreCase(cleanName)) {
                    throw new DuplicateResourceException("An organization with the name '" + cleanName + "' already exists.");
                }
            }
            throw new InvalidRequestException("Database error creating organization: " + (specificCause.isEmpty() ? ex.getMessage() : specificCause));
        }
        return saved;
    }

    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    @Transactional
    public void deleteOrganization(Long id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        // Unlink users from this organization and remove their org teams to clear many-to-many FK constraints
        List<User> orgUsers = userRepository.findByOrganizationId(id);
        for (User u : orgUsers) {
            u.setOrganization(null);
            u.getTeams().removeIf(t -> t.getOrganization().getId().equals(id));
            userRepository.save(u);
        }

        // Clear teams from projects to prevent FK constraint violations
        List<Project> orgProjects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(id);
        for (Project p : orgProjects) {
            p.getAssignedTeams().clear();
            projectRepository.save(p);
        }

        // Delete all invites as they might reference a team
        List<Invite> invites = inviteRepository.findByOrganizationId(id);
        inviteRepository.deleteAll(invites);

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
        targetUser.setOrgApproved(true);
        User savedUser = userRepository.save(targetUser);
        ensureDefaultTeams(org);

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

        if (Boolean.FALSE.equals(user.getOrgApproved())) {
            throw new InvalidRequestException(
                    "Your organization assignment is pending approval by an Organization Admin."
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
                .filter(u -> isUserInTeam(u, team.getName(), team.getId()))
                .map(u -> {
                    List<String> userTeamNames = new java.util.ArrayList<>(u.getTeams().stream().map(Team::getName).toList());
                    String defaultTeam = getDefaultTeamNameForRole(u.getRole());
                    if (defaultTeam != null && userTeamNames.stream().noneMatch(n -> n.equalsIgnoreCase(defaultTeam))) {
                        userTeamNames.add(defaultTeam);
                    }
                    return new MemberResponse(
                            u.getId(),
                            u.getFullName(),
                            u.getEmail(),
                            u.getPhoneNumber(),
                            u.getRole(),
                            u.isEnabled(),
                            u.getCreatedAt(),
                            userTeamNames
                    );
                })
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

    @Transactional
    public List<TeamResponse> listTeams(Long orgId, String loggedInEmail) {
        Organization org = validateOrganizationAccess(orgId, loggedInEmail).getOrganization();
        if (org == null) {
            org = organizationRepository.findById(orgId).orElse(null);
        }
        if (org != null) {
            ensureDefaultTeams(org);
        }
        List<User> orgUsers = userRepository.findByOrganizationId(orgId);
        return teamRepository.findByOrganizationId(orgId).stream()
                .map(t -> {
                    int count = (int) orgUsers.stream()
                            .filter(u -> isUserInTeam(u, t.getName(), t.getId()))
                            .count();
                    return new TeamResponse(t.getId(), t.getName(), count);
                })
                .toList();
    }

    @Transactional
    public List<TeamDetailResponse> listTeamsWithMembers(Long orgId, String loggedInEmail) {
        return listTeamsWithMembers(orgId, loggedInEmail, false, null);
    }

    @Transactional
    public List<TeamDetailResponse> listTeamsWithMembers(Long orgId, String loggedInEmail, Boolean availableOnly, Long forProjectId) {
        Organization org = validateOrganizationAccess(orgId, loggedInEmail).getOrganization();
        if (org == null) {
            org = organizationRepository.findById(orgId).orElse(null);
        }
        if (org != null) {
            ensureDefaultTeams(org);
        }

        List<Team> teams = teamRepository.findByOrganizationId(orgId);
        List<User> orgUsers = userRepository.findByOrganizationId(orgId);
        List<ProjectMember> pms = projectMemberRepository.findByProjectOrganizationId(orgId);

        java.util.Map<Long, String> userProjectMap = new java.util.HashMap<>();
        java.util.Map<Long, Integer> userActiveProjectCount = new java.util.HashMap<>();
        for (ProjectMember pm : pms) {
            if (forProjectId == null || !pm.getProject().getId().equals(forProjectId)) {
                userProjectMap.put(pm.getUser().getId(), pm.getProject().getName());
                userActiveProjectCount.put(pm.getUser().getId(), userActiveProjectCount.getOrDefault(pm.getUser().getId(), 0) + 1);
            }
        }

        return teams.stream()
                .map(t -> {
                    List<MemberResponse> teamMembers = orgUsers.stream()
                            .filter(u -> u.getRole() != Role.SUPER_ADMIN)
                            .filter(u -> isUserInTeam(u, t.getName(), t.getId()))
                            .map(u -> {
                                List<String> userTeamNames = new java.util.ArrayList<>(u.getTeams().stream().map(Team::getName).toList());
                                String defaultTeam = getDefaultTeamNameForRole(u.getRole());
                                if (defaultTeam != null && userTeamNames.stream().noneMatch(n -> n.equalsIgnoreCase(defaultTeam))) {
                                    userTeamNames.add(defaultTeam);
                                }

                                MemberResponse dto = new MemberResponse(
                                        u.getId(),
                                        u.getFullName(),
                                        u.getEmail(),
                                        u.getPhoneNumber(),
                                        u.getRole(),
                                        u.isEnabled(),
                                        u.getCreatedAt(),
                                        userTeamNames
                                );
                                String assignedProject = userProjectMap.get(u.getId());
                                if (assignedProject != null) {
                                    dto.setAssignedToProject(true);
                                    dto.setAssignedProjectName(assignedProject);
                                } else {
                                    dto.setAssignedToProject(false);
                                }
                                dto.setActiveProjectCount(userActiveProjectCount.getOrDefault(u.getId(), 0));
                                return dto;
                            })
                            .filter(m -> availableOnly == null || !availableOnly || !Boolean.TRUE.equals(m.getAssignedToProject()))
                            .toList();

                    TeamDetailResponse dto = new TeamDetailResponse();
                    dto.setId(t.getId());
                    dto.setName(t.getName());
                    dto.setDescription(t.getDescription());
                    dto.setLeadId(t.getLead() != null ? t.getLead().getId() : null);
                    dto.setLeadName(t.getLead() != null ? t.getLead().getFullName() : null);
                    dto.setCreatedAt(t.getCreatedAt());
                    dto.setUpdatedAt(t.getUpdatedAt());
                    dto.setMemberCount(teamMembers.size());
                    dto.setMembers(teamMembers);
                    return dto;
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

    @Transactional
    public void removeTeamMember(Long orgId, Long teamId, Long memberId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        if (!team.getOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("Team does not belong to this organization");
        }
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        user.getTeams().removeIf(t -> t.getId().equals(teamId));
        userRepository.save(user);
    }

    private MemberResponse buildMemberResponse(User u, java.util.Map<Long, String> userProjectMap, java.util.Map<Long, Integer> activeProjectCountMap) {
        List<String> userTeamNames = new java.util.ArrayList<>(u.getTeams().stream().map(Team::getName).toList());
        String defaultTeam = getDefaultTeamNameForRole(u.getRole());
        if (defaultTeam != null && userTeamNames.stream().noneMatch(n -> n.equalsIgnoreCase(defaultTeam))) {
            userTeamNames.add(defaultTeam);
        }

        MemberResponse dto = new MemberResponse(
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.getPhoneNumber(),
                u.getRole(),
                u.isEnabled(),
                u.getCreatedAt(),
                userTeamNames
        );
        String assignedProject = userProjectMap != null ? userProjectMap.get(u.getId()) : null;
        if (assignedProject != null) {
            dto.setAssignedToProject(true);
            dto.setAssignedProjectName(assignedProject);
        } else {
            dto.setAssignedToProject(false);
        }
        int activeCount = activeProjectCountMap != null ? activeProjectCountMap.getOrDefault(u.getId(), 0) : 0;
        dto.setActiveProjectCount(activeCount);
        return dto;
    }

    // ---- Members ----

    @Transactional
    public List<MemberResponse> listMembers(Long orgId, String loggedInEmail) {
        return listMembers(orgId, loggedInEmail, false, null);
    }

    @Transactional
    public List<MemberResponse> listMembers(Long orgId, String loggedInEmail, Boolean availableOnly, Long forProjectId) {
        Organization org = validateOrganizationAccess(orgId, loggedInEmail).getOrganization();
        if (org == null) {
            org = organizationRepository.findById(orgId).orElse(null);
        }
        if (org != null) {
            ensureDefaultTeams(org);
        }

        List<User> orgUsers = userRepository.findByOrganizationId(orgId);
        List<ProjectMember> pms = projectMemberRepository.findByProjectOrganizationId(orgId);

        java.util.Map<Long, String> userProjectMap = new java.util.HashMap<>();
        java.util.Map<Long, Integer> userActiveProjectCount = new java.util.HashMap<>();
        for (ProjectMember pm : pms) {
            if (forProjectId == null || !pm.getProject().getId().equals(forProjectId)) {
                userProjectMap.put(pm.getUser().getId(), pm.getProject().getName());
                userActiveProjectCount.put(pm.getUser().getId(), userActiveProjectCount.getOrDefault(pm.getUser().getId(), 0) + 1);
            }
        }

        return orgUsers.stream()
                .filter(u -> u.getRole() != Role.SUPER_ADMIN)
                .map(u -> buildMemberResponse(u, userProjectMap, userActiveProjectCount))
                .filter(m -> availableOnly == null || !availableOnly || !Boolean.TRUE.equals(m.getAssignedToProject()))
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
        assignUserToDefaultTeam(user, user.getOrganization());

        List<ProjectMember> userPms = projectMemberRepository.findByUserId(user.getId());
        java.util.Map<Long, String> map = new java.util.HashMap<>();
        if (!userPms.isEmpty()) {
            map.put(user.getId(), userPms.get(0).getProject().getName());
        }
        return buildMemberResponse(user, map, null);
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
    
    // ---- Join Requests ----

    @Transactional(readOnly = true)
    public List<MemberResponse> getJoinRequests(Long orgId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        return userRepository.findByRequestedOrganizationIdAndOrganizationIsNull(orgId)
                .stream()
                .map(u -> new MemberResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getPhoneNumber(),
                        u.getRole(),
                        u.isEnabled(),
                        u.getCreatedAt(),
                        List.of()
                ))
                .toList();
    }

    @Transactional
    public void approveJoinRequest(Long orgId, Long userId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRequestedOrganization() == null || !user.getRequestedOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("Invalid request");
        }
        user.setOrganization(user.getRequestedOrganization());
        user.setRequestedOrganization(null);
        userRepository.save(user);
        assignUserToDefaultTeam(user, user.getOrganization());
    }

    @Transactional
    public void rejectJoinRequest(Long orgId, Long userId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRequestedOrganization() == null || !user.getRequestedOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("Invalid request");
        }
        user.setRequestedOrganization(null);
        userRepository.save(user);
    }

    // ---- Pending Approvals ----

    @Transactional(readOnly = true)
    public List<MemberResponse> getPendingUsers(Long orgId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        return userRepository.findByOrganizationId(orgId)
                .stream()
                .filter(u -> Boolean.FALSE.equals(u.getOrgApproved()))
                .map(u -> new MemberResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getPhoneNumber(),
                        u.getRole(),
                        u.isEnabled(),
                        u.getCreatedAt(),
                        List.of()
                ))
                .toList();
    }

    @Transactional
    public void approveUser(Long orgId, Long userId, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId)) {
            throw new InvalidRequestException("User does not belong to this organization");
        }
        user.setOrgApproved(true);
        userRepository.save(user);
        assignUserToDefaultTeam(user, user.getOrganization());
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

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new InvalidRequestException("Email address is required.");
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();

        // 1. Check if user is already a member of this organization
        userRepository.findByEmail(cleanEmail).ifPresent(user -> {
            if (user.getOrganization() != null && user.getOrganization().getId().equals(orgId)) {
                throw new DuplicateResourceException("This user is already a member of your organization.");
            }
        });

        // 2. Check if a pending invitation already exists for this email
        inviteRepository.findByEmailIgnoreCaseAndOrganizationIdAndStatus(
                cleanEmail,
                orgId,
                InviteStatus.PENDING
        ).ifPresent(invite -> {
            throw new DuplicateResourceException(
                    "A pending invitation already exists for " + cleanEmail + "."
            );
        });

        // 3. Remove any previous non-pending (EXPIRED/ACCEPTED) invite records for this email and org to prevent constraint collisions
        List<Invite> oldInvites = inviteRepository.findByEmailIgnoreCaseAndOrganizationId(cleanEmail, orgId);
        if (!oldInvites.isEmpty()) {
            inviteRepository.deleteAll(oldInvites);
            inviteRepository.flush();
        }

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
        Invite invite = new Invite(cleanEmail, token, org, team, request.getRole());

        try {
            inviteRepository.saveAndFlush(invite);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.error("Database constraint violation creating invite for email={}: {}", cleanEmail, ex.getMessage());
            throw new DuplicateResourceException("An invitation already exists or cannot be created for this email address.");
        }

        try {
            emailService.sendInviteEmail(cleanEmail, token, org.getName(), request.getRole().name());
            log.info("INVITE successfully dispatched to org={} email=[redacted]", orgId);
        } catch (Exception e) {
            log.warn("Failed to send invite email to {}, invite record was saved: {}", cleanEmail, e.getMessage());
        }

        final Team finalTeam = team;
        userRepository.findByEmail(cleanEmail).ifPresent(invitedUser -> {
            String teamName = finalTeam != null ? finalTeam.getName() : "the organization";
            String msg = String.format("You have been invited to join %s by %s.", teamName, loggedInEmail);
            notificationService.createNotification(invitedUser, "Team Invitation", msg, "TEAM_INVITE", invite.getId());
        });

        activityService.logActivity(orgId, "Member invited", "Invited " + cleanEmail + " as " + request.getRole(), loggedInEmail);
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
        assignUserToDefaultTeam(user, user.getOrganization());
        invite.setStatus(InviteStatus.ACCEPTED);
        inviteRepository.save(invite);

        String jwtToken = jwtService.generateToken(user);
        Long orgId = user.getOrganization().getId();
        String orgName = user.getOrganization().getName();
        return new AuthResponse(jwtToken,
                new AuthResponse.UserPayload(
                        user.getId(), user.getEmail(), user.getFullName(), orgId, orgName, user.getRole(), user.getOrgApproved()));
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
    public OrgSettingsRequest updateOrgSettings(Long orgId, OrgSettingsRequest request, String loggedInEmail) {
        validateOrganizationAccess(orgId, loggedInEmail);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        if (request.getName() != null) {
            String cleanName = request.getName().trim();
            if (!cleanName.equalsIgnoreCase(org.getName()) && organizationRepository.existsByNameIgnoreCase(cleanName)) {
                throw new DuplicateResourceException("An organization with the name '" + cleanName + "' already exists.");
            }
            org.setName(cleanName);
        }
        if (request.getDescription() != null) org.setDescription(request.getDescription().trim());
        if (request.getSupportEmail() != null) org.setSupportEmail(request.getSupportEmail().trim());
        try {
            organizationRepository.save(org);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new DuplicateResourceException("An organization with this name already exists.");
        }
        return request;
    }
}
