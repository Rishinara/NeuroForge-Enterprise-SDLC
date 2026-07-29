package com.neuroforge.dto.ai;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RiskAnalysisRequest {

    private String projectName;

    private List<String> tasks;
}