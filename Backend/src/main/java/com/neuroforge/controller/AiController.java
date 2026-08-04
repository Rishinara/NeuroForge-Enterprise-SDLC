package com.neuroforge.controller;

import com.neuroforge.ai.GroqService;
import com.neuroforge.dto.ai.StoryPointRequest;
import com.neuroforge.dto.ai.StoryPointResponse;
import org.springframework.web.bind.annotation.*;
import com.neuroforge.dto.ai.TaskEnhancementResponse;
import com.neuroforge.dto.ai.SprintPlanningRequest;
import com.neuroforge.dto.ai.SprintPlanningResponse;
import com.neuroforge.dto.ai.RiskAnalysisRequest;
import com.neuroforge.dto.ai.RiskAnalysisResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
@Tag(name = "AI Module", description = "AI-powered task management features")
public class AiController {

    private final GroqService groqService;

    public AiController(GroqService groqService) {
        this.groqService = groqService;
    }

    // ---------------------------------------
    // AI Test Endpoint
    // ---------------------------------------
    @Operation(summary = "Test AI Prompt")
    @PostMapping("/test")
    public Map<String, String> test(@RequestBody Map<String, String> request) {

        String prompt = request.get("prompt");

        String response = groqService.askGroq(prompt);

        return Map.of(
                "prompt", prompt,
                "response", response
        );
    }

    // ---------------------------------------
    // AI Story Point Estimation
    // ---------------------------------------
    @Operation(summary = "Estimate Story Points")
    @PostMapping("/story-points")
    public StoryPointResponse estimateStoryPoints(
            @RequestBody StoryPointRequest request) {

        String response = groqService.estimateStoryPoints(
                request.getTitle(),
                request.getDescription()
        );

        return new StoryPointResponse(
                null,
                response
        );
    }

    // ---------------------------------------
    // AI Priority Recommendation
    // ---------------------------------------
    @Operation(summary = "Recommend Task Priority")
    @PostMapping("/priority")
    public Map<String, String> recommendPriority(
            @RequestBody StoryPointRequest request) {

        String response = groqService.recommendPriority(
                request.getTitle(),
                request.getDescription()
        );

        return Map.of("response", response);
    }

    // ---------------------------------------
    // AI Task Breakdown
    // ---------------------------------------
    @Operation(summary = "Generate Task Breakdown")
    @PostMapping("/breakdown")
    public Map<String, String> generateTaskBreakdown(
            @RequestBody StoryPointRequest request) {

        String response = groqService.generateTaskBreakdown(
                request.getTitle(),
                request.getDescription()
        );

        return Map.of("response", response);
    }

    // ---------------------------------------
    // AI Acceptance Criteria
    // ---------------------------------------
    @Operation(summary = "Generate Acceptance Criteria")
    @PostMapping("/acceptance-criteria")
    public Map<String, String> generateAcceptanceCriteria(
            @RequestBody StoryPointRequest request) {

        String response = groqService.generateAcceptanceCriteria(
                request.getTitle(),
                request.getDescription()
        );

        return Map.of("response", response);
    }

    @Operation(summary = "Enhance Task Description")
    @PostMapping("/enhance-description")
    public TaskEnhancementResponse enhanceTaskDescription(
            @RequestBody StoryPointRequest request) {

        String response = groqService.enhanceTaskDescription(
                request.getTitle(),
                request.getDescription()
        );

        return new TaskEnhancementResponse(response);
    }

    @Operation(summary = "Analyze Sprint Planning")
    @PostMapping("/sprint-planning")
    public SprintPlanningResponse analyzeSprint(
            @RequestBody SprintPlanningRequest request) {

        String response = groqService.analyzeSprint(
                request.getSprintName(),
                request.getTasks()
        );

        return new SprintPlanningResponse(response);
    }

    @Operation(summary = "Analyze Project Risks")
    @PostMapping("/risk-analysis")
    public RiskAnalysisResponse analyzeRisk(
            @RequestBody RiskAnalysisRequest request) {

        String response = groqService.analyzeProjectRisk(
                request.getProjectName(),
                request.getTasks()
        );

        return new RiskAnalysisResponse(response);
    }
}