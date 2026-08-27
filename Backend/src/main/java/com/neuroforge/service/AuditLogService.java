package com.neuroforge.service;

import com.neuroforge.dto.auditlog.AuditLogResponse;
import com.neuroforge.entity.AuditLog;
import com.neuroforge.entity.Project;
import com.neuroforge.entity.User;
import com.neuroforge.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void logAction(User user, Project project, String action, String entityType, Long entityId, String ipAddress, String details) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .project(project)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .ipAddress(ipAddress)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLogResponse> getLogsByProject(Long projectId) {
        return auditLogRepository.findByProjectIdOrderByTimestampDesc(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(log.getId());
        response.setAction(log.getAction());
        response.setEntityType(log.getEntityType());
        response.setEntityId(log.getEntityId());
        response.setIpAddress(log.getIpAddress());
        response.setDetails(log.getDetails());
        response.setUserName(log.getUser().getFullName());
        response.setTimestamp(log.getTimestamp());
        return response;
    }
}
