package com.neuroforge.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuroforge.backend.entity.SpecVersion.SpecContent;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AISpecService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public AISpecService(ChatClient.Builder chatClientBuilder, ObjectMapper objectMapper) {
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public SpecContent generateSpecsFromDescription(String description) {
        String systemPrompt = """
            You are an expert Product Manager and Business Analyst.
            The user will provide a plain-English feature description.
            You must convert this description into a highly structured JSON response containing:
            1. 'rawDescription': The original description provided by the user.
            2. 'userStories': An array of user stories, each with 'asA', 'iWantTo', 'soThat' fields.
            3. 'acceptanceCriteria': An array of criteria, each with a 'title' and a list of 'criteria' strings.
            4. 'functionalRequirements': A list of strings.
            5. 'nonFunctionalRequirements': A list of strings.
            
            Return ONLY the raw JSON object, without any markdown formatting, backticks, or additional text.
            """;

        String responseText = chatClient.prompt()
                .system(systemPrompt)
                .user(description)
                .call()
                .content();

        // Sometimes LLMs wrap the response in markdown json blocks despite instructions.
        if (responseText != null && responseText.startsWith("```json")) {
            responseText = responseText.substring(7, responseText.length() - 3).trim();
        } else if (responseText != null && responseText.startsWith("```")) {
            responseText = responseText.substring(3, responseText.length() - 3).trim();
        }

        try {
            return objectMapper.readValue(responseText, SpecContent.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse AI response into SpecContent", e);
        }
    }
}
