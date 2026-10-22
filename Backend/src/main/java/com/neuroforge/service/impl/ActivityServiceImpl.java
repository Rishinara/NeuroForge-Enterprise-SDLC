package com.neuroforge.service.impl;

import com.neuroforge.dto.organization.ActivityResponse;
import com.neuroforge.entity.ActivityLog;
import com.neuroforge.entity.Organization;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.ActivityLogRepository;
import com.neuroforge.repository.OrganizationRepository;
import com.neuroforge.service.ActivityService;
import com.neuroforge.service.OrgService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {

    private final ActivityLogRepository activityLogRepository;
    private final OrganizationRepository organizationRepository;
    // We can't inject OrgService directly if it causes circular dependency, 
    // but we can check org access directly using UserRepository or just let controllers handle it.
    // For now we'll do a simple check.
    private final com.neuroforge.repository.UserRepository userRepository;
    private final com.neuroforge.repository.ProjectRepository projectRepository;
    private final com.neuroforge.service.NotificationService notificationService;

    @Override
    @Transactional
    public void logActivity(Long orgId, String action, String details, String actorEmail) {
        logActivity(orgId, null, null, action, details, actorEmail);
    }

    @Override
    @Transactional
    public void logActivity(Long orgId, Long projectId, String projectName, String action, String details, String actorEmail) {
        Organization org = organizationRepository.findById(orgId).orElse(null);
        if (org != null) {
            com.neuroforge.entity.User actor = userRepository.findByEmail(actorEmail).orElse(null);
            String actorRole = actor != null && actor.getRole() != null ? actor.getRole().name() : null;

            ActivityLog log = new ActivityLog(org, projectId, projectName, action, details, actorEmail, actorRole);
            activityLogRepository.save(log);

            // Notify Org Admin if actor is Project Manager
            if (actor != null && actor.getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER) {
                List<com.neuroforge.entity.User> orgUsers = userRepository.findByOrganizationId(orgId);
                for (com.neuroforge.entity.User u : orgUsers) {
                    if (u.getRole() == com.neuroforge.enums.Role.ORG_ADMIN) {
                        String title = "PM Update: " + action;
                        String msg = actor.getFullName() + " - " + details;
                        notificationService.createNotification(u, title, msg, "SYSTEM_UPDATE", orgId);
                    }
                }
            }

            // Notify Project Manager if actor is Developer or QA Tester
            if (actor != null && (actor.getRole().isDeveloper() || actor.getRole() == com.neuroforge.enums.Role.QA_TESTER)) {
                List<com.neuroforge.entity.User> orgUsers = userRepository.findByOrganizationId(orgId);
                for (com.neuroforge.entity.User u : orgUsers) {
                    if (u.getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER) {
                        String title = "Team Update: " + action;
                        String msg = actor.getFullName() + " - " + details;
                        notificationService.createNotification(u, title, msg, "SYSTEM_UPDATE", orgId);
                    }
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getRecentActivities(Long orgId, String loggedInEmail) {
        return getRecentActivities(orgId, null, loggedInEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getRecentActivities(Long orgId, Long projectId, String loggedInEmail) {
        // Simple access validation
        com.neuroforge.entity.User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN) {
            if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId)) {
                throw new com.neuroforge.exception.InvalidRequestException("Access denied");
            }
        }

        boolean isOrgAdmin = user.getRole() == com.neuroforge.enums.Role.ORG_ADMIN;
        boolean isProjectManager = user.getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER;

        java.util.Set<Long> pmProjectIds = new java.util.HashSet<>();
        if (isProjectManager) {
            List<com.neuroforge.entity.Project> allProjects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
            for (com.neuroforge.entity.Project p : allProjects) {
                if (p.getMembers() != null && p.getMembers().stream().anyMatch(m -> m.getUser() != null && user.getId().equals(m.getUser().getId()))) {
                    pmProjectIds.add(p.getId());
                }
            }
        }

        List<ActivityLog> logs;
        if (projectId != null) {
            logs = activityLogRepository.findTop50ByOrganizationIdAndProjectIdOrderByCreatedAtDesc(orgId, projectId);
        } else {
            logs = activityLogRepository.findTop50ByOrganizationIdOrderByCreatedAtDesc(orgId);
        }

        return logs.stream()
                .filter(a -> {
                    if (isOrgAdmin) {
                        // For Org Admin: ONLY Project Manager updates are available
                        if ("PROJECT_MANAGER".equalsIgnoreCase(a.getActorRole())) {
                            return true;
                        }
                        if (a.getActorEmail() != null) {
                            return userRepository.findByEmail(a.getActorEmail())
                                    .map(u -> u.getRole() == com.neuroforge.enums.Role.PROJECT_MANAGER)
                                    .orElse(false);
                        }
                        return false;
                    }
                    if (isProjectManager) {
                        // If PM, must be for the specified project or projects the PM manages/belongs to
                        if (projectId != null) {
                            if (a.getProjectId() == null || !a.getProjectId().equals(projectId)) {
                                return false;
                            }
                        } else if (!pmProjectIds.isEmpty()) {
                            if (a.getProjectId() == null || !pmProjectIds.contains(a.getProjectId())) {
                                return false;
                            }
                        }

                        // Filter to updates from team members (developers, QA testers, clients)
                        if (a.getActorRole() != null) {
                            String r = a.getActorRole().toUpperCase();
                            if (r.contains("DEV") || r.contains("QA") || r.contains("TESTER") || r.equals("CLIENT")) {
                                return true;
                            }
                        }
                        if (a.getActorEmail() != null) {
                            return userRepository.findByEmail(a.getActorEmail())
                                    .map(u -> u.getRole().isDeveloper() || u.getRole() == com.neuroforge.enums.Role.QA_TESTER || u.getRole() == com.neuroforge.enums.Role.CLIENT)
                                    .orElse(false);
                        }
                        return false;
                    }
                    return true;
                })
                .map(a -> new ActivityResponse(
                        a.getId(),
                        a.getAction(),
                        a.getDetails(),
                        a.getActorEmail(),
                        a.getCreatedAt(),
                        a.getProjectId(),
                        a.getProjectName(),
                        a.getActorRole()
                ))
                .toList();
    }

    @Override
    @Transactional
    public void deleteActivity(Long orgId, Long activityId, String loggedInEmail) {
        com.neuroforge.entity.User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN) {
            if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId)) {
                throw new com.neuroforge.exception.InvalidRequestException("Access denied");
            }
        }

        ActivityLog log = activityLogRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));
        if (!log.getOrganization().getId().equals(orgId)) {
            throw new com.neuroforge.exception.InvalidRequestException("Activity does not belong to this organization");
        }

        activityLogRepository.delete(log);
    }

    @Override
    @Transactional
    public void clearActivities(Long orgId, String loggedInEmail) {
        com.neuroforge.entity.User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN) {
            if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId)) {
                throw new com.neuroforge.exception.InvalidRequestException("Access denied");
            }
        }

        activityLogRepository.deleteByOrganizationId(orgId);
    }
}
