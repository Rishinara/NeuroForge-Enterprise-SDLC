package com.neuroforge.service;

import com.neuroforge.dto.project.CreateProjectRequest;
import com.neuroforge.dto.project.ProjectResponse;
import com.neuroforge.dto.project.UpdateProjectRequest;

import java.util.List;


public interface ProjectService {
    ProjectResponse createProject(CreateProjectRequest request);

    List<ProjectResponse> getProjectsByOrganization(Long orgId);

    ProjectResponse getProject(Long projectId);

    ProjectResponse updateProject(
            Long projectId,
            UpdateProjectRequest request
    );
    void deleteProject(Long projectId, String username);

    List<ProjectResponse> getProjectsForUser(String username);
}
