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

                Estimate story points for the following task.

                Title:
                %s

                Description:
                %s

                Return ONLY in this format:

                Story Points: <number>
                Reason: <short explanation>

                Allowed story points:
                1,2,3,5,8,13
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Priority Recommendation
    // -------------------------------------------------

    public String recommendPriority(String title, String description) {

        String prompt = """
                You are an Agile Project Manager.

                Recommend the priority for this task.

                Title:
                %s

                Description:
                %s

                Return:

                Priority:
                LOW / MEDIUM / HIGH / CRITICAL

                Reason:
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Task Breakdown
    // -------------------------------------------------

    public String generateTaskBreakdown(String title, String description) {

        String prompt = """
                Break down the following task into smaller subtasks.

                Title:
                %s

                Description:
                %s

                Return only a numbered list.
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Acceptance Criteria
    // -------------------------------------------------

    public String generateAcceptanceCriteria(String title, String description) {

        String prompt = """
                Generate acceptance criteria for the following task.

                Title:
                %s

                Description:
                %s

                Return a bullet list.
                """.formatted(title, description);

        return askGroq(prompt);
    }

    // -------------------------------------------------
    // Task Description Enhancement
    // -------------------------------------------------

    public String enhanceTaskDescription(String title, String description) {

        String prompt = """
                You are an experienced Agile Product Owner.

                Improve the following task description.

                Title:
                %s

                Description:
                %s

                Return the response in the following format:

                Enhanced Description:
                <Improved Description>

                Requirements:
                - Requirement 1
                - Requirement 2
                - Requirement 3

                Acceptance Criteria:
                - Criteria 1
                - Criteria 2
                - Criteria 3

                Keep the response professional and concise.
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
                You are an experienced Scrum Master.

                Analyze the following sprint.

                Sprint:
                %s

                Tasks:
                %s

                Provide:

                1. Sprint Summary
                2. Workload Analysis
                3. Risks
                4. Recommendations
                5. Sprint Health

                Keep the response concise.
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
                You are a Software Project Manager.

                Analyze the following project.

                Project:
                %s

                Tasks:
                %s

                Identify:

                1. High Risk Tasks
                2. Possible Delays
                3. Dependency Issues
                4. Testing Risks
                5. Suggestions to reduce risks

                Return a professional report.
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