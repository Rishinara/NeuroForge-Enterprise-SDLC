package com.neuroforge.service;

import com.neuroforge.dto.organization.ActivityResponse;
import java.util.List;

public interface ActivityService {
    void logActivity(Long orgId, String action, String details, String actorEmail);
    void logActivity(Long orgId, Long projectId, String projectName, String action, String details, String actorEmail);
    List<ActivityResponse> getRecentActivities(Long orgId, String loggedInEmail);
    List<ActivityResponse> getRecentActivities(Long orgId, Long projectId, String loggedInEmail);
    void deleteActivity(Long orgId, Long activityId, String loggedInEmail);
    void clearActivities(Long orgId, String loggedInEmail);
}
