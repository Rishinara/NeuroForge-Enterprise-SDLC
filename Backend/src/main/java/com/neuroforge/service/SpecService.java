package com.neuroforge.service;

import com.neuroforge.dto.spec.SpecRequest;
import com.neuroforge.dto.spec.SpecResponse;
import com.neuroforge.dto.spec.SpecSummaryResponse;
import com.neuroforge.dto.spec.SpecVersionDTO;

import java.util.List;

public interface SpecService {
    List<SpecSummaryResponse> getSpecsByProject(Long projectId, String username);
    SpecResponse getSpecById(Long specId, String username);
    SpecResponse createSpec(Long projectId, SpecRequest request, String username);
    SpecResponse updateSpec(Long specId, SpecRequest request, String username);
    List<SpecVersionDTO> getSpecVersions(Long specId, String username);
    SpecResponse getSpecByVersion(Long specId, Integer version, String username);
    SpecResponse submitForReview(Long specId, String username);
    SpecResponse approveSpec(Long specId, String username);
    SpecResponse requestChanges(Long specId, String note, String username);
}
