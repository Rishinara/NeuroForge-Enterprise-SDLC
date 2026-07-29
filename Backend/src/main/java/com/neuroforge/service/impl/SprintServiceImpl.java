package com.neuroforge.service.impl;

import com.neuroforge.dto.board.BoardResponse;
import com.neuroforge.dto.snapshot.BurndownResponse;
import com.neuroforge.dto.snapshot.StoryPointSnapshotResponse;
import com.neuroforge.dto.sprint.CreateSprintRequest;
import com.neuroforge.dto.sprint.SprintResponse;
import com.neuroforge.dto.sprint.UpdateSprintRequest;
import com.neuroforge.dto.sprintsummary.SprintSummaryResponse;
import com.neuroforge.entity.*;
import com.neuroforge.enums.SprintStatus;
import com.neuroforge.enums.TaskStatus;
import com.neuroforge.exception.DuplicateResourceException;
import com.neuroforge.exception.InvalidRequestException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.mapper.TaskMapper;
import com.neuroforge.repository.*;
import com.neuroforge.service.SprintService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SprintServiceImpl implements SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final StoryPointSnapshotRepository storyPointSnapshotRepository;

    //<---------------------sprint------------------------------>

    @Override
    public SprintResponse createSprint(CreateSprintRequest request, String loggedInEmail) {

        User loggedInUser = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Project not found"));

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new InvalidRequestException("Start date cannot be after end date");
        }

        if (sprintRepository.existsByProjectIdAndNameIgnoreCase(
                project.getId(),
                request.getName())) {

            throw new DuplicateResourceException(
                    "Sprint with the same name already exists in this project");
        }

        Sprint sprint = new Sprint();

        sprint.setName(request.getName());
        sprint.setGoal(request.getGoal());
        sprint.setStartDate(request.getStartDate());
        sprint.setEndDate(request.getEndDate());
        sprint.setStatus(SprintStatus.PLANNED);

        sprint.setProject(project);
        sprint.setCreatedBy(loggedInUser);

        Sprint savedSprint = sprintRepository.save(sprint);

        Sprint loadedSprint = sprintRepository.findSprintById(savedSprint.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        return mapToResponse(loadedSprint);
    }

    private SprintResponse mapToResponse(Sprint sprint) {

        SprintResponse response = new SprintResponse();

        response.setId(sprint.getId());
        response.setName(sprint.getName());
        response.setGoal(sprint.getGoal());

        response.setStartDate(sprint.getStartDate());
        response.setEndDate(sprint.getEndDate());

        response.setStatus(sprint.getStatus());

        response.setProjectId(sprint.getProject().getId());
        response.setProjectName(sprint.getProject().getName());

        response.setCreatedById(sprint.getCreatedBy().getId());
        response.setCreatedByName(sprint.getCreatedBy().getFullName());

        return response;
    }

    @Override
    public SprintResponse updateSprint(Long sprintId,
                                       UpdateSprintRequest request,
                                       String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new InvalidRequestException("Start date cannot be after end date");
        }

        if (!sprint.getName().equalsIgnoreCase(request.getName())
                && sprintRepository.existsByProjectIdAndNameIgnoreCase(
                sprint.getProject().getId(),
                request.getName())) {

            throw new DuplicateResourceException(
                    "Sprint with the same name already exists in this project");
        }

        sprint.setName(request.getName());
        sprint.setGoal(request.getGoal());
        sprint.setStartDate(request.getStartDate());
        sprint.setEndDate(request.getEndDate());

        sprintRepository.save(sprint);

        Sprint updatedSprint = sprintRepository.findSprintById(sprint.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        return mapToResponse(updatedSprint);

    }

    @Override
    public void deleteSprint(Long sprintId,
                             String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        if (sprint.getStatus() == SprintStatus.ACTIVE) {
            throw new InvalidRequestException(
                    "Active sprint cannot be deleted");
        }

        sprintRepository.delete(sprint);
    }

    @Transactional(readOnly = true)
    @Override
    public SprintResponse getSprintById(Long sprintId,
                                        String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Sprint sprint = sprintRepository.findSprintById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        return mapToResponse(sprint);
    }

    @Transactional(readOnly = true)
    @Override
    public List<SprintResponse> getProjectSprints(Long projectId,
                                                  String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        projectRepository.findById(projectId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Project not found"));

        return sprintRepository.findAllByProjectId(projectId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    //<------------------------sprint lifecycle--------------->

    @Override
    @Transactional
    public SprintResponse startSprint(Long sprintId, String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Sprint sprint = sprintRepository.findSprintById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        if (sprint.getStatus() == SprintStatus.COMPLETED) {
            throw new InvalidRequestException(
                    "Completed sprint cannot be started again");
        }

        if (sprint.getStatus() == SprintStatus.ACTIVE) {
            throw new InvalidRequestException(
                    "Sprint is already active");
        }

        if (sprintRepository.existsByProjectIdAndStatus(
                sprint.getProject().getId(),
                SprintStatus.ACTIVE)) {

            throw new InvalidRequestException(
                    "Another sprint is already active for this project");
        }

        sprint.setStatus(SprintStatus.ACTIVE);

        sprintRepository.save(sprint);

        Sprint updatedSprint = sprintRepository.findSprintById(sprint.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        return mapToResponse(updatedSprint);
    }

    @Override
    @Transactional
    public SprintSummaryResponse completeSprint(Long sprintId,
                                                String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Sprint sprint = sprintRepository.findSprintById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        if (sprint.getStatus() == SprintStatus.COMPLETED) {
            throw new InvalidRequestException("Sprint is already completed");
        }

        sprint.setStatus(SprintStatus.COMPLETED);

        sprintRepository.save(sprint);

        List<Task> tasks = taskRepository.findBySprintIdOrderByPriorityAscCreatedAtAsc(sprintId);

        int totalTasks = tasks.size();
        int completedTasks = 0;

        int totalStoryPoints = 0;
        int completedStoryPoints = 0;

        for (Task task : tasks) {

            int points = task.getStoryPoints() == null
                    ? 0
                    : task.getStoryPoints();

            totalStoryPoints += points;

            if (task.getStatus() == TaskStatus.DONE) {
                completedTasks++;
                completedStoryPoints += points;
            }
        }

        int pendingTasks = totalTasks - completedTasks;

        int remainingStoryPoints =
                totalStoryPoints - completedStoryPoints;

        double completionPercentage =
                totalTasks == 0
                        ? 0.0
                        : (completedTasks * 100.0) / totalTasks;

        SprintSummaryResponse response =
                new SprintSummaryResponse();

        response.setSprintId(sprint.getId());
        response.setSprintName(sprint.getName());

        response.setTotalTasks(totalTasks);
        response.setCompletedTasks(completedTasks);
        response.setPendingTasks(pendingTasks);

        response.setTotalStoryPoints(totalStoryPoints);
        response.setCompletedStoryPoints(completedStoryPoints);
        response.setRemainingStoryPoints(remainingStoryPoints);

        response.setCompletionPercentage(
                Math.round(completionPercentage * 100.0) / 100.0);

        captureStoryPointSnapshot(sprintId, loggedInEmail);

        return response;
    }
    @Override
    @Transactional(readOnly = true)
    public BoardResponse getSprintBoard(Long sprintId,
                                        String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Sprint sprint = sprintRepository.findSprintById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        List<Task> tasks = taskRepository.findBySprintIdOrderByPriorityAscCreatedAtAsc(sprintId);

        BoardResponse response = new BoardResponse();

        response.setSprintId(sprint.getId());
        response.setSprintName(sprint.getName());

        for (Task task : tasks) {

            switch (task.getStatus()) {

                case TODO ->
                        response.getTodo().add(taskMapper.mapToResponse(task));

                case IN_PROGRESS ->
                        response.getInProgress().add(taskMapper.mapToResponse(task));

                case CODE_REVIEW ->
                        response.getCodeReview().add(taskMapper.mapToResponse(task));

                case TESTING ->
                        response.getTesting().add(taskMapper.mapToResponse(task));

                case DONE ->
                        response.getDone().add(taskMapper.mapToResponse(task));
            }
        }

        return response;
    }

    //<-------------------------snapshot----------------------->

    @Override
    @Transactional
    public void captureStoryPointSnapshot(Long sprintId,
                                          String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Sprint sprint = sprintRepository.findSprintById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        LocalDate today = LocalDate.now();

        if (storyPointSnapshotRepository
                .findBySprintIdAndSnapshotDate(sprintId, today)
                .isPresent()) {

            throw new DuplicateResourceException(
                    "Snapshot already captured for today");
        }

        List<Task> tasks = taskRepository.findBySprintIdOrderByPriorityAscCreatedAtAsc(sprintId);

        int totalStoryPoints = 0;
        int completedStoryPoints = 0;

        for (Task task : tasks) {

            int points = task.getStoryPoints() == null ? 0 : task.getStoryPoints();

            totalStoryPoints += points;

            if (task.getStatus() == TaskStatus.DONE) {
                completedStoryPoints += points;
            }
        }

        StoryPointSnapshot snapshot = new StoryPointSnapshot();

        snapshot.setSprint(sprint);
        snapshot.setSnapshotDate(today);
        snapshot.setTotalStoryPoints(totalStoryPoints);
        snapshot.setCompletedStoryPoints(completedStoryPoints);
        snapshot.setRemainingStoryPoints(
                totalStoryPoints - completedStoryPoints);

        storyPointSnapshotRepository.save(snapshot);
    }

    private StoryPointSnapshotResponse mapToSnapshotResponse(
            StoryPointSnapshot snapshot) {

        StoryPointSnapshotResponse response =
                new StoryPointSnapshotResponse();

        response.setId(snapshot.getId());
        response.setSnapshotDate(snapshot.getSnapshotDate());
        response.setTotalStoryPoints(snapshot.getTotalStoryPoints());
        response.setCompletedStoryPoints(snapshot.getCompletedStoryPoints());
        response.setRemainingStoryPoints(snapshot.getRemainingStoryPoints());

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public BurndownResponse getBurndown(Long sprintId,
                                        String loggedInEmail) {

        userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Sprint sprint = sprintRepository.findSprintById(sprintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Sprint not found"));

        List<StoryPointSnapshot> snapshots =
                storyPointSnapshotRepository
                        .findBySprintIdOrderBySnapshotDateAsc(sprintId);

        BurndownResponse response = new BurndownResponse();

        response.setSprintId(sprint.getId());
        response.setSprintName(sprint.getName());

        response.setSnapshots(
                snapshots.stream()
                        .map(this::mapToSnapshotResponse)
                        .toList()
        );

        return response;
    }

}
