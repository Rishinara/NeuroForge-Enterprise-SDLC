package com.neuroforge.controller;

import com.neuroforge.dto.auditlog.AuditLogResponse;
import com.neuroforge.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public List<AuditLogResponse> getAuditLogs(@PathVariable Long projectId) {
        return auditLogService.getLogsByProject(projectId);
    }
}
