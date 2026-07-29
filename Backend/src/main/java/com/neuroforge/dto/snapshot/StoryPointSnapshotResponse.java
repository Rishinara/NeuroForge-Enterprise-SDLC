package com.neuroforge.dto.snapshot;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class StoryPointSnapshotResponse {

    private Long id;

    private LocalDate snapshotDate;

    private Integer totalStoryPoints;

    private Integer completedStoryPoints;

    private Integer remainingStoryPoints;
}