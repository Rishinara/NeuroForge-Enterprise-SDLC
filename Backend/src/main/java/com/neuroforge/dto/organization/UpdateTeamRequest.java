package com.neuroforge.dto.organization;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTeamRequest {
    private String name;
    private String description;
    private Long leadId;
}
