package com.neuroforge.dto.organization;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityResponse {
    private Long id;
    private String action;
    private String details;
    private String actorEmail;
    private LocalDateTime createdAt;
}
