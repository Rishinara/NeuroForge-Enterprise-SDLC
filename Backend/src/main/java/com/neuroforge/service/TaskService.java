package com.neuroforge.service;

import com.neuroforge.dto.task.*;

import java.util.List;

public interface TaskService {

    TaskResponse createTask(Long projectId, CreateTaskRequest request, String loggedInEmail);

    TaskResponse updateTask(Long taskId,
                            UpdateTaskRequest request,
                            String loggedInEmail);

    void deleteTask(Long taskId,
                    String loggedInEmail);

    TaskResponse getTaskById(Long taskId,
                             String loggedInEmail);

    List<TaskResponse> getProjectBacklog(Long projectId,
                                         String loggedInEmail);

    TaskResponse assignTaskToSprint(Long taskId,
                                    Long sprintId,
                                    String loggedInEmail);

    TaskResponse removeTaskFromSprint(Long taskId,
                                      String loggedInEmail);

    TaskResponse updateTaskStatus(Long taskId,
                                  UpdateTaskStatusRequest request,
                                  String loggedInEmail);

    List<TaskStatusHistoryResponse> getTaskStatusHistory(Long taskId,
                                                         String loggedInEmail);
}
