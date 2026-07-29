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

    private List<StoryPointSnapshotResponse> snapshots = new ArrayList<>();
}