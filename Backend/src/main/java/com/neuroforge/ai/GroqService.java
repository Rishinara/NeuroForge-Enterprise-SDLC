package com.neuroforge.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class GroqService {

    @Value("${groq.api.key:}")
    private String apiKey;

    private static final String API_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate = new RestTemplate();

    public String askGroq(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "AI Service is not configured. Please configure GROQ_API_KEY environment variable.";
        }

        GroqMessage message =
                new GroqMessage("user", prompt);

        GroqRequest request =
                new GroqRequest(
                        "openai/gpt-oss-20b",
                        List.of(message)
                );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<GroqRequest> entity =
                new HttpEntity<>(request, headers);

        try {

            ResponseEntity<GroqResponse> response =
                    restTemplate.exchange(
                            API_URL,
                            HttpMethod.POST,
                            entity,
                            GroqResponse.class
                    );

            if (response.getBody() == null
                    || response.getBody().getChoices() == null
                    || response.getBody().getChoices().isEmpty()) {

                return "No response from AI.";
            }

            return response.getBody()
                    .getChoices()
                    .get(0)
                    .getMessage()
                    .getContent();

        } catch (Exception e) {

            return "AI Service is temporarily unavailable. Please try again later.";

        }
    }

    // -------------------------------------------------
    // Story Point Estimation
    // -------------------------------------------------

    public String estimateStoryPoints(String title, String description) {

        String prompt = """
                You are an Agile Scrum expert.
                Estimate story points for the following task using Fibonacci points (1, 2, 3, 5, 8, 13).

                Title: %s
                Description: %s

                Format your response clearly as:
                Story Points: <number>
                ### Rationale
                <Concise explanation of complexity, effort, and uncertainty>
                ### Key Considerations
                - <bullet point 1>
                - <bullet point 2>
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Priority Recommendation
    // -------------------------------------------------

    public String recommendPriority(String title, String description) {

        String prompt = """
                You are an Agile Project Manager.
                Recommend the priority for this task: LOW, MEDIUM, HIGH, or CRITICAL.

                Title: %s
                Description: %s

                Format your response clearly as:
                Priority: <LOW | MEDIUM | HIGH | CRITICAL>
                ### Impact Assessment
                <Why this priority is recommended based on business impact and urgency>
                ### Suggested Timeline
                - <When this should be scheduled in the backlog or active sprint>
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Task Breakdown
    // -------------------------------------------------

    public String generateTaskBreakdown(String title, String description) {

        String prompt = """
                You are a Senior Software Architect.
                Break down the following task into clear, actionable subtasks.

                Title: %s
                Description: %s

                Format your response with:
                ### Subtasks Breakdown
                1. <Subtask 1 with brief action>
                2. <Subtask 2 with brief action>
                3. <Subtask 3 with brief action>
                ### Technical Considerations
                - <Consideration or prerequisite>
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Acceptance Criteria
    // -------------------------------------------------

    public String generateAcceptanceCriteria(String title, String description) {

        String prompt = """
                You are a Lead QA Engineer and Scrum Product Owner.
                Generate comprehensive acceptance criteria in Given-When-Then or clear testable bullet points for the following task.

                Title: %s
                Description: %s

                Format your response as:
                ### Acceptance Criteria
                - <Criteria 1>
                - <Criteria 2>
                - <Criteria 3>
                ### Edge Cases & Validation
                - <Validation or boundary condition to check>
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Task Description Enhancement
    // -------------------------------------------------

    public String enhanceTaskDescription(String title, String description) {

        String prompt = """
                You are an experienced Agile Product Owner.
                Improve and expand the following task description for enterprise software engineering.

                Title: %s
                Description: %s

                Format your response with these exact markdown sections:
                ### Enhanced Description
                <Clear, professional description explaining context and objective>
                ### Functional Requirements
                - <Requirement 1>
                - <Requirement 2>
                ### Acceptance Criteria
                - <Criteria 1>
                - <Criteria 2>
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Sprint Planning
    // -------------------------------------------------

    public String analyzeSprint(String sprintName, List<String> tasks) {

        StringBuilder taskList = new StringBuilder();

        for (String task : tasks) {
            taskList.append("- ").append(task).append("\n");
        }

        String prompt = """
                You are an experienced Scrum Master and Delivery Lead.
                Analyze the following active sprint and provide a structured health assessment.

                Sprint: %s
                Tasks:
                %s

                Format your response with these exact sections:
                Sprint Health: <HEALTHY | AT RISK | CRITICAL>

                ### Sprint Summary
                <2-3 concise sentences on scope, focus, and progress>

                ### Workload & Task Distribution
                - <Insight on workload distribution and story point density>

                ### Identified Risks & Bottlenecks
                - <Key delivery, technical, or dependency risk>

                ### Actionable Recommendations
                - <Immediate recommendation for the team to achieve the sprint goal>
                """.formatted(sprintName, taskList);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Project Risk Analysis
    // -------------------------------------------------

    public String analyzeProjectRisk(String projectName, List<String> tasks) {

        StringBuilder taskList = new StringBuilder();

        for (String task : tasks) {
            taskList.append("- ").append(task).append("\n");
        }

        String prompt = """
                You are an Enterprise Software Project Director.
                Analyze the delivery risks for the following project.

                Project: %s
                Tasks:
                %s

                Format your response with these exact sections:
                ### High Risk Tasks & Delivery Bottlenecks
                - <Specific high-risk task or area>

                ### Dependency & Resource Risks
                - <Potential blocker, cross-team or environment dependency>

                ### Testing & Quality Risks
                - <QA, regression, or validation challenge>

                ### Risk Mitigation Plan
                - <Concrete mitigation action to protect delivery deadlines>
                """.formatted(projectName, taskList);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // AI Specification Generation
    // -------------------------------------------------

    public String generateSpecJson(String title, String description, String tone, String complexity) {
        String prompt = """
                You are an expert Technical Business Analyst.
                Generate a software specification for the following feature.

                Title: %s
                Description: %s
                Tone: %s
                Complexity: %s

                Return ONLY a valid JSON object with EXACTLY the following structure (no markdown tags, just raw JSON):
                {
                  "userStories": [
                    {
                      "asA": "string",
                      "iWant": "string",
                      "soThat": "string",
                      "criteria": ["string", "string"]
                    }
                  ],
                  "functionalRequirements": ["string", "string"],
                  "nonFunctionalRequirements": ["string", "string"]
                }
                
                Adjust the amount of detail and edge cases based on the Complexity, and the writing style based on the Tone.
                """.formatted(title, description, tone != null ? tone : "TECHNICAL", complexity != null ? complexity : "MODERATE");

        return askGroq(prompt);
    }
}