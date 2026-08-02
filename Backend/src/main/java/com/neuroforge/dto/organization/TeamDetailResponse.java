package com.neuroforge.dto.organization;

import com.neuroforge.dto.organization.MemberResponse;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class TeamDetailResponse {
    private Long id;
    private String name;
    private String description;
    private Long leadId;
    private String leadName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int memberCount;
    private List<MemberResponse> members;
}
