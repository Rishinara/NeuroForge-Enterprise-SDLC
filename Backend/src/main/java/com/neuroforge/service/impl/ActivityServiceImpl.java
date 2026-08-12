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
    private final com.neuroforge.service.NotificationService notificationService;

    @Override
    @Transactional
    public void logActivity(Long orgId, String action, String details, String actorEmail) {
        Organization org = organizationRepository.findById(orgId)
                .orElse(null);
        if (org != null) {
            ActivityLog log = new ActivityLog(org, action, details, actorEmail);
            activityLogRepository.save(log);

            // Notify Org Admin if actor is Project Manager
            com.neuroforge.entity.User actor = userRepository.findByEmail(actorEmail).orElse(null);
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
            if (actor != null && (actor.getRole() == com.neuroforge.enums.Role.DEVELOPER || actor.getRole() == com.neuroforge.enums.Role.QA_TESTER)) {
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
        // Simple access validation
        com.neuroforge.entity.User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN) {
            if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId)) {
                throw new com.neuroforge.exception.InvalidRequestException("Access denied");
            }
        }

        return activityLogRepository.findTop20ByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(a -> new ActivityResponse(
                        a.getId(),
                        a.getAction(),
                        a.getDetails(),
                        a.getActorEmail(),
                        a.getCreatedAt()
                ))
                .toList();
    }
}
