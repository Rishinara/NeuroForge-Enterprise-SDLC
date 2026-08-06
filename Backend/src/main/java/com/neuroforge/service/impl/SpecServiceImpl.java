package com.neuroforge.service.impl;

import com.neuroforge.dto.spec.SpecRequest;
import com.neuroforge.dto.spec.SpecResponse;
import com.neuroforge.dto.spec.SpecSummaryResponse;
import com.neuroforge.dto.spec.SpecVersionDTO;
import com.neuroforge.dto.spec.UserStoryDTO;
import com.neuroforge.entity.Project;
import com.neuroforge.entity.Spec;
import com.neuroforge.entity.User;
import com.neuroforge.entity.UserStory;
import com.neuroforge.enums.SpecStatus;
import com.neuroforge.exception.InvalidRequestException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.ProjectRepository;
import com.neuroforge.repository.SpecRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.repository.UserStoryRepository;
import com.neuroforge.service.SpecService;
import com.neuroforge.service.ActivityService;
import com.neuroforge.ai.GroqService;
import com.neuroforge.exception.SpecGenerationException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SpecServiceImpl implements SpecService {

    private final SpecRepository specRepository;
    private final UserStoryRepository userStoryRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final GroqService groqService;
    private final ObjectMapper objectMapper;
    private final ActivityService activityService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private String formatStatus(SpecStatus status) {
        if (status == null) return "Draft";
        return status.name().replace("_", " ");
    }

    private SpecStatus parseStatus(String statusStr) {
        if (statusStr == null) return SpecStatus.Draft;
        try {
            return SpecStatus.valueOf(statusStr.replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            return SpecStatus.Draft;
        }
    }

    private UserStoryDTO mapStoryToDTO(UserStory story) {
        return UserStoryDTO.builder()
                .id(story.getId() != null ? story.getId().toString() : null)
                .asA(story.getAsA())
                .iWant(story.getIWant())
                .soThat(story.getSoThat())
                .criteria(new ArrayList<>(story.getCriteria()))
                .build();
    }

    private UserStory mapDTOToStory(UserStoryDTO dto, Spec spec) {
        UserStory story = new UserStory();
        if (dto.getId() != null && !dto.getId().startsWith("local-")) {
            try {
                story.setId(Long.parseLong(dto.getId()));
            } catch (NumberFormatException ignored) {}
        }
        story.setAsA(dto.getAsA());
        story.setIWant(dto.getIWant());
        story.setSoThat(dto.getSoThat());
        story.setCriteria(dto.getCriteria() != null ? new ArrayList<>(dto.getCriteria()) : new ArrayList<>());
        story.setSpec(spec);
        return story;
    }

    private List<SpecVersionDTO> getVersionHistory(Spec spec) {
        Long originalId = spec.getParentSpec() != null ? spec.getParentSpec().getId() : spec.getId();
        List<Spec> versions = specRepository.findAllByParentSpecIdOrId(originalId, originalId);
        return versions.stream()
                .map(v -> SpecVersionDTO.builder()
                        .version(v.getVersion())
                        .status(formatStatus(v.getStatus()))
                        .updatedAt(v.getUpdatedAt() != null ? v.getUpdatedAt().format(DATE_FORMATTER) : "—")
                        .updatedBy(v.getCreatedBy() != null ? v.getCreatedBy().getFullName() : "—")
                        .build())
                .sorted(Comparator.comparing(SpecVersionDTO::getVersion).reversed())
                .collect(Collectors.toList());
    }

    private String cleanJson(String jsonStr) {
        if (jsonStr == null) return "";
        jsonStr = jsonStr.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.substring(7);
        } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.substring(3);
        }
        if (jsonStr.endsWith("```")) {
            jsonStr = jsonStr.substring(0, jsonStr.length() - 3);
        }
        return jsonStr.trim();
    }

    private SpecResponse mapToSpecResponse(Spec spec) {
        List<UserStoryDTO> stories = spec.getUserStories().stream()
                .map(this::mapStoryToDTO)
                .collect(Collectors.toList());

        return SpecResponse.builder()
                .id(spec.getId())
                .title(spec.getTitle())
                .description(spec.getDescription())
                .status(formatStatus(spec.getStatus()))
                .version(spec.getVersion())
                .userStories(stories)
                .functionalRequirements(new ArrayList<>(spec.getFunctionalRequirements()))
                .nonFunctionalRequirements(new ArrayList<>(spec.getNonFunctionalRequirements()))
                .reviewNote(spec.getReviewNote())
                .versions(getVersionHistory(spec))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SpecSummaryResponse> getSpecsByProject(Long projectId, String username) {
        List<Spec> allSpecs = specRepository.findAllByProjectId(projectId);
        Map<Long, Spec> latestSpecs = new HashMap<>();

        for (Spec spec : allSpecs) {
            Long groupId = (spec.getParentSpec() != null) ? spec.getParentSpec().getId() : spec.getId();
            Spec currentLatest = latestSpecs.get(groupId);
            if (currentLatest == null || spec.getVersion() > currentLatest.getVersion()) {
                latestSpecs.put(groupId, spec);
            }
        }

        return latestSpecs.values().stream()
                .map(spec -> SpecSummaryResponse.builder()
                        .id(spec.getId())
                        .title(spec.getTitle())
                        .storyCount(spec.getUserStories().size())
                        .updatedAt(spec.getUpdatedAt() != null ? spec.getUpdatedAt().format(DATE_FORMATTER) : "—")
                        .version(spec.getVersion())
                        .status(formatStatus(spec.getStatus()))
                        .build())
                .sorted(Comparator.comparing(SpecSummaryResponse::getTitle))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SpecResponse getSpecById(Long specId, String username) {
        Spec spec = specRepository.findById(specId)
                .orElseThrow(() -> new ResourceNotFoundException("Spec not found with id: " + specId));
        return mapToSpecResponse(spec);
    }

    @Override
    public SpecResponse createSpec(Long projectId, SpecRequest request, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Spec spec = new Spec();
        spec.setTitle(request.getTitle());
        spec.setDescription(request.getDescription());
        spec.setStatus(SpecStatus.Draft);
        spec.setVersion(1);
        spec.setProject(project);
        spec.setCreatedBy(user);

        if (request.getTone() != null || request.getComplexity() != null) {
            String jsonStr = groqService.generateSpecJson(request.getTitle(), request.getDescription(), request.getTone(), request.getComplexity());
            
            if (jsonStr != null && jsonStr.contains("AI Service is temporarily unavailable")) {
                throw new SpecGenerationException("AI Service is temporarily unavailable. Please try again later.");
            }
            if (jsonStr != null && jsonStr.contains("No response from AI")) {
                throw new SpecGenerationException("No response from AI. Please try again later.");
            }
            
            jsonStr = cleanJson(jsonStr);

            try {
                com.neuroforge.dto.spec.SpecRequest generated = objectMapper.readValue(jsonStr, com.neuroforge.dto.spec.SpecRequest.class);
                if (generated.getUserStories() != null) request.setUserStories(generated.getUserStories());
                if (generated.getFunctionalRequirements() != null) request.setFunctionalRequirements(generated.getFunctionalRequirements());
                if (generated.getNonFunctionalRequirements() != null) request.setNonFunctionalRequirements(generated.getNonFunctionalRequirements());
            } catch (Exception e) {
                String retryPrompt = "Your previous response was not valid JSON. Return ONLY a valid JSON object. No explanation, no markdown tags. Original request: " + request.getTitle();
                String retryJson = groqService.askGroq(retryPrompt);
                retryJson = cleanJson(retryJson);
                try {
                    com.neuroforge.dto.spec.SpecRequest generated = objectMapper.readValue(retryJson, com.neuroforge.dto.spec.SpecRequest.class);
                    if (generated.getUserStories() != null) request.setUserStories(generated.getUserStories());
                    if (generated.getFunctionalRequirements() != null) request.setFunctionalRequirements(generated.getFunctionalRequirements());
                    if (generated.getNonFunctionalRequirements() != null) request.setNonFunctionalRequirements(generated.getNonFunctionalRequirements());
                } catch (Exception ex) {
                    throw new SpecGenerationException("AI Spec Generation failed due to malformed JSON. Please try again.");
                }
            }
        }

        if (request.getFunctionalRequirements() != null) {
            spec.setFunctionalRequirements(new ArrayList<>(request.getFunctionalRequirements()));
        }
        if (request.getNonFunctionalRequirements() != null) {
            spec.setNonFunctionalRequirements(new ArrayList<>(request.getNonFunctionalRequirements()));
        }

        Spec savedSpec = specRepository.save(spec);

        if (request.getUserStories() != null) {
            List<UserStory> stories = request.getUserStories().stream()
                    .map(dto -> mapDTOToStory(dto, savedSpec))
                    .collect(Collectors.toList());
            userStoryRepository.saveAll(stories);
            savedSpec.setUserStories(stories);
        }

        String logMsg = "Created spec: " + savedSpec.getTitle() + (request.getTone() != null ? " (AI Generated)" : "");
        activityService.logActivity(project.getOrganization().getId(), "Spec Created", logMsg, username);

        return mapToSpecResponse(savedSpec);
    }

    @Override
    public SpecResponse updateSpec(Long specId, SpecRequest request, String username) {
        Spec existingSpec = specRepository.findById(specId)
                .orElseThrow(() -> new ResourceNotFoundException("Spec not found with id: " + specId));
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (existingSpec.getStatus() == SpecStatus.Approved) {
            // Immutable: create a new version
            Spec nextSpec = new Spec();
            nextSpec.setTitle(request.getTitle());
            nextSpec.setDescription(request.getDescription());
            nextSpec.setStatus(SpecStatus.Draft);
            nextSpec.setVersion(existingSpec.getVersion() + 1);
            nextSpec.setProject(existingSpec.getProject());
            nextSpec.setCreatedBy(user);
            nextSpec.setParentSpec(existingSpec.getParentSpec() != null ? existingSpec.getParentSpec() : existingSpec);

            if (request.getFunctionalRequirements() != null) {
                nextSpec.setFunctionalRequirements(new ArrayList<>(request.getFunctionalRequirements()));
            }
            if (request.getNonFunctionalRequirements() != null) {
                nextSpec.setNonFunctionalRequirements(new ArrayList<>(request.getNonFunctionalRequirements()));
            }

            Spec savedNextSpec = specRepository.save(nextSpec);

            if (request.getUserStories() != null) {
                List<UserStory> stories = request.getUserStories().stream()
                        .map(dto -> mapDTOToStory(dto, savedNextSpec))
                        .collect(Collectors.toList());
                userStoryRepository.saveAll(stories);
                savedNextSpec.setUserStories(stories);
            }
            activityService.logActivity(existingSpec.getProject().getOrganization().getId(), "Spec Version Created", "Created new version for spec: " + savedNextSpec.getTitle(), username);
            return mapToSpecResponse(savedNextSpec);
        } else {
            // Update in-place
            existingSpec.setTitle(request.getTitle());
            existingSpec.setDescription(request.getDescription());
            existingSpec.setCreatedBy(user);

            if (request.getFunctionalRequirements() != null) {
                existingSpec.getFunctionalRequirements().clear();
                existingSpec.getFunctionalRequirements().addAll(request.getFunctionalRequirements());
            }
            if (request.getNonFunctionalRequirements() != null) {
                existingSpec.getNonFunctionalRequirements().clear();
                existingSpec.getNonFunctionalRequirements().addAll(request.getNonFunctionalRequirements());
            }

            // Remove old stories
            existingSpec.getUserStories().clear();
            Spec savedSpec = specRepository.save(existingSpec);

            if (request.getUserStories() != null) {
                List<UserStory> stories = request.getUserStories().stream()
                        .map(dto -> mapDTOToStory(dto, savedSpec))
                        .collect(Collectors.toList());
                userStoryRepository.saveAll(stories);
                savedSpec.getUserStories().addAll(stories);
                specRepository.save(savedSpec);
            }

            activityService.logActivity(existingSpec.getProject().getOrganization().getId(), "Spec Edited", "Edited spec: " + savedSpec.getTitle(), username);

            return mapToSpecResponse(savedSpec);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SpecVersionDTO> getSpecVersions(Long specId, String username) {
        Spec spec = specRepository.findById(specId)
                .orElseThrow(() -> new ResourceNotFoundException("Spec not found with id: " + specId));
        return getVersionHistory(spec);
    }

    @Override
    @Transactional(readOnly = true)
    public SpecResponse getSpecByVersion(Long specId, Integer version, String username) {
        Spec spec = specRepository.findById(specId)
                .orElseThrow(() -> new ResourceNotFoundException("Spec not found with id: " + specId));
        Long originalId = spec.getParentSpec() != null ? spec.getParentSpec().getId() : spec.getId();
        List<Spec> versions = specRepository.findAllByParentSpecIdOrId(originalId, originalId);
        
        Spec matched = versions.stream()
                .filter(v -> v.getVersion().equals(version))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Version " + version + " not found for spec " + specId));
        
        return mapToSpecResponse(matched);
    }

    @Override
    public SpecResponse submitForReview(Long specId, String username) {
        Spec spec = specRepository.findById(specId)
                .orElseThrow(() -> new ResourceNotFoundException("Spec not found with id: " + specId));
        if (spec.getStatus() != SpecStatus.Draft) {
            throw new InvalidRequestException("Only Draft specs can be submitted for review");
        }
        spec.setStatus(SpecStatus.In_Review);
        spec.setReviewNote(null);
        activityService.logActivity(spec.getProject().getOrganization().getId(), "Spec Submitted", "Submitted spec for review: " + spec.getTitle(), username);
        return mapToSpecResponse(specRepository.save(spec));
    }

    @Override
    public SpecResponse approveSpec(Long specId, String username) {
        Spec spec = specRepository.findById(specId)
                .orElseThrow(() -> new ResourceNotFoundException("Spec not found with id: " + specId));
        if (spec.getStatus() != SpecStatus.In_Review) {
            throw new InvalidRequestException("Only In Review specs can be approved");
        }
        spec.setStatus(SpecStatus.Approved);
        activityService.logActivity(spec.getProject().getOrganization().getId(), "Spec Approved", "Approved spec: " + spec.getTitle(), username);
        return mapToSpecResponse(specRepository.save(spec));
    }

    @Override
    public SpecResponse requestChanges(Long specId, String note, String username) {
        Spec spec = specRepository.findById(specId)
                .orElseThrow(() -> new ResourceNotFoundException("Spec not found with id: " + specId));
        if (spec.getStatus() != SpecStatus.In_Review) {
            throw new InvalidRequestException("Only In Review specs can have changes requested");
        }
        spec.setStatus(SpecStatus.Draft);
        spec.setReviewNote(note);
        String excerpt = note != null && note.length() > 50 ? note.substring(0, 47) + "..." : note;
        activityService.logActivity(spec.getProject().getOrganization().getId(), "Spec Changes Requested", "Requested changes on spec: " + spec.getTitle() + " - " + excerpt, username);
        return mapToSpecResponse(specRepository.save(spec));
    }
}
