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
public class SpecRequest {
    private String title;
    private String description;
    private List<UserStoryDTO> userStories;
    private List<String> functionalRequirements;
    private List<String> nonFunctionalRequirements;
    private String tone;
    private String complexity;
}
