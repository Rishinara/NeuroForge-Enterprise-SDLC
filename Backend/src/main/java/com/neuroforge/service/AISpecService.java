package com.neuroforge.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuroforge.ai.GroqService;
import com.neuroforge.entity.SpecVersion.SpecContent;
import org.springframework.stereotype.Service;

@Service
public class AISpecService {

    private final GroqService groqService;
    private final ObjectMapper objectMapper;

    public AISpecService(GroqService groqService,
                         ObjectMapper objectMapper) {

        this.groqService = groqService;
        this.objectMapper = objectMapper;
    }

    public SpecContent generateSpecsFromDescription(String description) {

        String systemPrompt = """
            You are an expert Product Manager and Business Analyst.
            The user will provide a plain-English feature description.
            You must convert this description into a highly structured JSON response containing:

            1. rawDescription
            2. userStories
            3. acceptanceCriteria
            4. functionalRequirements
            5. nonFunctionalRequirements

            Return ONLY valid JSON.
            """;

        String prompt = systemPrompt + "\n\nFeature Description:\n" + description;

        String responseText = groqService.askGroq(prompt);

        if (responseText != null && responseText.startsWith("```json")) {
            responseText = responseText.substring(7, responseText.length() - 3).trim();
        } else if (responseText != null && responseText.startsWith("```")) {
            responseText = responseText.substring(3, responseText.length() - 3).trim();
        }

        try {
            return objectMapper.readValue(responseText, SpecContent.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }
}