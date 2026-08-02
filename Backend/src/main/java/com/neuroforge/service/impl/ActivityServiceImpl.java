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

    @Override
    @Transactional
    public void logActivity(Long orgId, String action, String details, String actorEmail) {
        Organization org = organizationRepository.findById(orgId)
                .orElse(null);
        if (org != null) {
            ActivityLog log = new ActivityLog(org, action, details, actorEmail);
            activityLogRepository.save(log);
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
