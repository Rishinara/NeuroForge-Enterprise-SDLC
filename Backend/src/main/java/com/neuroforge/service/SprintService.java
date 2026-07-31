package com.neuroforge.service;

import com.neuroforge.dto.board.BoardResponse;
import com.neuroforge.dto.snapshot.BurndownResponse;
import com.neuroforge.dto.sprint.CreateSprintRequest;
import com.neuroforge.dto.sprint.SprintResponse;
import com.neuroforge.dto.sprint.UpdateSprintRequest;
import com.neuroforge.dto.sprintsummary.SprintSummaryResponse;

import java.util.List;

public interface SprintService {

    SprintResponse createSprint(CreateSprintRequest request, String loggedInEmail);

    SprintResponse updateSprint(Long sprintId, UpdateSprintRequest request, String loggedInEmail);

    void deleteSprint(Long sprintId, String loggedInEmail);

    SprintResponse getSprintById(Long sprintId, String loggedInEmail);

    List<SprintResponse> getProjectSprints(Long projectId, String loggedInEmail);

    SprintResponse startSprint(Long sprintId, String loggedInEmail);

    SprintSummaryResponse completeSprint(Long sprintId, String loggedInEmail);

    BoardResponse getSprintBoard(Long sprintId,
                                 String loggedInEmail);

    void captureStoryPointSnapshot(Long sprintId,
                                   String loggedInEmail);

    BurndownResponse getBurndown(Long sprintId,
                                 String loggedInEmail);
}