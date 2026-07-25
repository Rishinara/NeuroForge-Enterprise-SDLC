package com.neuroforge.dto.board;

import com.neuroforge.dto.task.TaskResponse;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BoardResponse {

    private Long sprintId;

    private String sprintName;

    private List<TaskResponse> todo = new ArrayList<>();

    private List<TaskResponse> inProgress = new ArrayList<>();

    private List<TaskResponse> codeReview = new ArrayList<>();

    private List<TaskResponse> testing = new ArrayList<>();

    private List<TaskResponse> done = new ArrayList<>();
}