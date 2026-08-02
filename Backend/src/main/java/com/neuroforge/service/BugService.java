package com.neuroforge.service;

import com.neuroforge.dto.bug.BugRequest;
import com.neuroforge.dto.bug.BugResponse;

import java.util.List;

public interface BugService {
    BugResponse createBug(BugRequest request, String loggedInEmail);
    BugResponse updateBug(Long bugId, BugRequest request, String loggedInEmail);
    List<BugResponse> getBugsByProject(Long projectId, String loggedInEmail);
    void deleteBug(Long bugId, String loggedInEmail);
}
