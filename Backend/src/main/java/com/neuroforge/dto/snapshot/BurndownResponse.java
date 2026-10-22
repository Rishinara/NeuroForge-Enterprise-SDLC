package com.neuroforge.dto.snapshot;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BurndownResponse {

    private Long sprintId;

    private String sprintName;

    private java.time.LocalDate startDate;

    private java.time.LocalDate endDate;

    private Integer totalStoryPoints;

    private Integer remainingStoryPoints;

    private List<StoryPointSnapshotResponse> snapshots = new ArrayList<>();
}