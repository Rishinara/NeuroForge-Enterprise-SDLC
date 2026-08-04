package com.neuroforge.service;

import com.neuroforge.dto.milestone.MilestoneRequest;
import com.neuroforge.dto.milestone.MilestoneResponse;

import java.util.List;

public interface MilestoneService {
    MilestoneResponse createMilestone(MilestoneRequest request, String loggedInEmail);
    MilestoneResponse updateMilestone(Long milestoneId, MilestoneRequest request, String loggedInEmail);
    List<MilestoneResponse> getMilestonesByProject(Long projectId, String loggedInEmail);
    void deleteMilestone(Long milestoneId, String loggedInEmail);
}
