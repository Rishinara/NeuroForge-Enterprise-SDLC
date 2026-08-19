package com.neuroforge.dto.auditlog;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AuditLogResponse {
    private Long id;
    private String action;
    private String entityType;
    private Long entityId;
    private String ipAddress;
    private String details;
    private String userName;
    private LocalDateTime timestamp;
}
