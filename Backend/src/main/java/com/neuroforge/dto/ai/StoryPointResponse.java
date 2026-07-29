package com.neuroforge.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class StoryPointResponse {

    private Integer storyPoints;
    private String reason;

}