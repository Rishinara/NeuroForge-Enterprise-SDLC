package com.neuroforge.dto.organization;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrgResponse {
    private Long id;
    private String name;
    private String description;
    private String supportEmail;
    private LocalDateTime createdAt;
}
