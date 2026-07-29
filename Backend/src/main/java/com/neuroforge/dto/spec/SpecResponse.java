package com.neuroforge.dto.spec;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpecResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private Integer version;
    private List<UserStoryDTO> userStories;
    private List<String> functionalRequirements;
    private List<String> nonFunctionalRequirements;
    private List<SpecVersionDTO> versions;
}
