package com.neuroforge.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuroforge.ai.GroqService;
import com.neuroforge.dto.ai.AiTriageOverrideRequest;
import com.neuroforge.dto.ai.AiTriageResponse;
import com.neuroforge.dto.websocket.TaskStatusUpdateEvent;
import com.neuroforge.entity.ProjectMember;
import com.neuroforge.entity.Task;
import com.neuroforge.entity.User;
import com.neuroforge.entity.mongo.AiTriageSuggestion;
import com.neuroforge.enums.TaskPriority;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.ProjectMemberRepository;
import com.neuroforge.repository.TaskRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.repository.mongo.AiTriageSuggestionRepository;
import com.neuroforge.service.TriageService;
import com.neuroforge.websocket.TaskEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TriageServiceImpl implements TriageService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final GroqService groqService;
    private final AiTriageSuggestionRepository aiTriageSuggestionRepository;
    private final ObjectMapper objectMapper;
    private final Optional<TaskEventPublisher> taskEventPublisher;

    @Override
    @Transactional
    public AiTriageResponse autoTriageTask(Long taskId) {
        log.info("Starting AI Triage for task ID: {}", taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        // 1. Prepare Team Members Context
        List<ProjectMember> members = projectMemberRepository.findByProjectId(task.getProject().getId());
        String teamMembersSummary;
        if (members != null && !members.isEmpty()) {
            teamMembersSummary = members.stream()
                    .map(m -> String.format("ID: %d, Name: %s, Email: %s",
                            m.getUser().getId(), m.getUser().getFullName(), m.getUser().getEmail()))
                    .collect(Collectors.joining("\n"));
        } else {
            List<User> allUsers = userRepository.findAll();
            teamMembersSummary = allUsers.stream()
                    .map(u -> String.format("ID: %d, Name: %s, Email: %s",
                            u.getId(), u.getFullName(), u.getEmail()))
                    .collect(Collectors.joining("\n"));
        }

        // 2. Prepare Historical Tasks Context
        List<Task> pastTasks = taskRepository.findByProjectId(task.getProject().getId());
        String pastHistorySummary = pastTasks.stream()
                .filter(t -> !t.getId().equals(taskId))
                .limit(20)
                .map(t -> String.format("Title: '%s', Category: '%s', Assignee: '%s'",
                        t.getTitle(),
                        t.getCategory() != null ? t.getCategory() : "Unassigned",
                        t.getAssignee() != null ? t.getAssignee().getFullName() : "None"))
                .collect(Collectors.joining("\n"));

        if (pastHistorySummary.isBlank()) {
            pastHistorySummary = "No past history available for this project yet.";
        }

        // 3. Call AI Service
        String jsonResponse = groqService.generateTriageSuggestionJson(
                task.getTitle(),
                task.getDescription() != null ? task.getDescription() : "",
                teamMembersSummary,
                pastHistorySummary
        );

        // 4. Parse AI Response
        String category = "Backend";
        String priorityStr = task.getPriority() != null ? task.getPriority().name() : "MEDIUM";
        Integer points = task.getStoryPoints() != null ? task.getStoryPoints() : 3;
        Long suggestedAssigneeId = null;
        String suggestedAssigneeName = null;
        String reasoning = "Suggested based on ticket description and team expertise.";

        try {
            String cleanedJson = jsonResponse.trim();
            if (cleanedJson.startsWith("```json")) {
                cleanedJson = cleanedJson.substring(7);
            }
            if (cleanedJson.startsWith("```")) {
                cleanedJson = cleanedJson.substring(3);
            }
            if (cleanedJson.endsWith("```")) {
                cleanedJson = cleanedJson.substring(0, cleanedJson.length() - 3);
            }
            cleanedJson = cleanedJson.trim();

            JsonNode node = objectMapper.readTree(cleanedJson);

            if (node.has("category") && !node.get("category").isNull()) {
                category = node.get("category").asText();
            }
            if (node.has("priority") && !node.get("priority").isNull()) {
                priorityStr = node.get("priority").asText();
            }
            if (node.has("estimatedStoryPoints") && !node.get("estimatedStoryPoints").isNull()) {
                points = node.get("estimatedStoryPoints").asInt();
            }
            if (node.has("suggestedAssigneeId") && !node.get("suggestedAssigneeId").isNull() && node.get("suggestedAssigneeId").isNumber()) {
                suggestedAssigneeId = node.get("suggestedAssigneeId").asLong();
            }
            if (node.has("suggestedAssigneeName") && !node.get("suggestedAssigneeName").isNull()) {
                suggestedAssigneeName = node.get("suggestedAssigneeName").asText();
            }
            if (node.has("reasoning") && !node.get("reasoning").isNull()) {
                reasoning = node.get("reasoning").asText();
            }
        } catch (Exception e) {
            log.error("Failed to parse LLM triage response for task {}: {}", taskId, jsonResponse, e);
        }

        // Verify suggested assignee ID exists
        if (suggestedAssigneeId != null) {
            Optional<User> userOpt = userRepository.findById(suggestedAssigneeId);
            if (userOpt.isPresent()) {
                suggestedAssigneeName = userOpt.get().getFullName();
            } else {
                suggestedAssigneeId = null;
            }
        }

        // 5. Save/Update Suggestion in MongoDB
        AiTriageSuggestion suggestion = aiTriageSuggestionRepository
                .findFirstByTaskIdOrderByCreatedAtDesc(taskId)
                .orElseGet(() -> AiTriageSuggestion.builder()
                        .taskId(taskId)
                        .createdAt(LocalDateTime.now())
                        .build());

        suggestion.setCategory(category);
        suggestion.setPriority(priorityStr);
        suggestion.setEstimatedStoryPoints(points);
        suggestion.setSuggestedAssigneeId(suggestedAssigneeId);
        suggestion.setSuggestedAssigneeName(suggestedAssigneeName);
        suggestion.setReasoning(reasoning);
        suggestion.setStatus("PENDING");
        suggestion.setUpdatedAt(LocalDateTime.now());

        try {
            suggestion = aiTriageSuggestionRepository.save(suggestion);
        } catch (Exception e) {
            log.warn("Could not save triage suggestion to MongoDB (Mongo may be offline): {}", e.getMessage());
        }

        return mapToResponse(suggestion);
    }

    @Override
    @Async
    public void autoTriageTaskAsync(Long taskId) {
        try {
            autoTriageTask(taskId);
        } catch (Exception e) {
            log.error("Async AI Triage failed for task ID {}", taskId, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AiTriageResponse getTriageSuggestion(Long taskId) {
        Optional<AiTriageSuggestion> opt = Optional.empty();
        try {
            opt = aiTriageSuggestionRepository.findFirstByTaskIdOrderByCreatedAtDesc(taskId);
        } catch (Exception e) {
            log.warn("MongoDB read failed for task ID {}: {}", taskId, e.getMessage());
        }

        if (opt.isPresent()) {
            return mapToResponse(opt.get());
        }

        // Generate on demand if not existing
        return autoTriageTask(taskId);
    }

    @Override
    @Transactional
    public Task acceptTriageSuggestion(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        AiTriageResponse suggestion = getTriageSuggestion(taskId);

        if (suggestion.getCategory() != null) {
            task.setCategory(suggestion.getCategory());
        }
        if (suggestion.getPriority() != null) {
            try {
                task.setPriority(TaskPriority.valueOf(suggestion.getPriority().toUpperCase()));
            } catch (Exception ignored) {}
        }
        if (suggestion.getEstimatedStoryPoints() != null) {
            task.setStoryPoints(suggestion.getEstimatedStoryPoints());
        }
        if (suggestion.getSuggestedAssigneeId() != null) {
            userRepository.findById(suggestion.getSuggestedAssigneeId())
                    .ifPresent(task::setAssignee);
        }

        Task savedTask = taskRepository.save(task);

        // Update Mongo document status
        try {
            aiTriageSuggestionRepository.findFirstByTaskIdOrderByCreatedAtDesc(taskId).ifPresent(s -> {
                s.setStatus("ACCEPTED");
                s.setUpdatedAt(LocalDateTime.now());
                aiTriageSuggestionRepository.save(s);
            });
        } catch (Exception e) {
            log.warn("Failed to update MongoDB status to ACCEPTED: {}", e.getMessage());
        }

        // Publish WebSocket notification
        publishTaskUpdate(savedTask);

        return savedTask;
    }

    @Override
    @Transactional
    public Task overrideTriageSuggestion(Long taskId, AiTriageOverrideRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            task.setCategory(request.getCategory());
        }
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            try {
                task.setPriority(TaskPriority.valueOf(request.getPriority().toUpperCase()));
            } catch (Exception ignored) {}
        }
        if (request.getStoryPoints() != null) {
            task.setStoryPoints(request.getStoryPoints());
        }
        if (request.getAssigneeId() != null) {
            userRepository.findById(request.getAssigneeId())
                    .ifPresent(task::setAssignee);
        }

        Task savedTask = taskRepository.save(task);

        // Update Mongo document status
        try {
            aiTriageSuggestionRepository.findFirstByTaskIdOrderByCreatedAtDesc(taskId).ifPresent(s -> {
                s.setStatus("OVERRIDDEN");
                s.setUpdatedAt(LocalDateTime.now());
                aiTriageSuggestionRepository.save(s);
            });
        } catch (Exception e) {
            log.warn("Failed to update MongoDB status to OVERRIDDEN: {}", e.getMessage());
        }

        // Publish WebSocket notification
        publishTaskUpdate(savedTask);

        return savedTask;
    }

    private void publishTaskUpdate(Task task) {
        taskEventPublisher.ifPresent(publisher -> {
            TaskStatusUpdateEvent event = new TaskStatusUpdateEvent();
            event.setTaskId(task.getId());
            event.setTaskTitle(task.getTitle());
            event.setNewStatus(task.getStatus());
            if (task.getSprint() != null) {
                event.setSprintId(task.getSprint().getId());
            }
            if (task.getProject() != null) {
                event.setProjectId(task.getProject().getId());
            }
            publisher.publishTaskStatusUpdate(event);
        });
    }

    private AiTriageResponse mapToResponse(AiTriageSuggestion s) {
        return AiTriageResponse.builder()
                .id(s.getId())
                .taskId(s.getTaskId())
                .category(s.getCategory())
                .priority(s.getPriority())
                .estimatedStoryPoints(s.getEstimatedStoryPoints())
                .suggestedAssigneeId(s.getSuggestedAssigneeId())
                .suggestedAssigneeName(s.getSuggestedAssigneeName())
                .reasoning(s.getReasoning())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
