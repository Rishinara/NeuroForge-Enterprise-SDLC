package com.neuroforge.service;

import com.neuroforge.dto.organization.ActivityResponse;
import java.util.List;

public interface ActivityService {
    void logActivity(Long orgId, String action, String details, String actorEmail);
    List<ActivityResponse> getRecentActivities(Long orgId, String loggedInEmail);
}
