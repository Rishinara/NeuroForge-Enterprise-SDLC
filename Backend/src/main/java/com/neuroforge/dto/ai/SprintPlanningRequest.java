package com.neuroforge.dto.ai;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SprintPlanningRequest {

    private String sprintName;

    private List<String> tasks;

}