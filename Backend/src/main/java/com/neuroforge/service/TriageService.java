package com.neuroforge.service;

import com.neuroforge.dto.ai.AiTriageOverrideRequest;
import com.neuroforge.dto.ai.AiTriageResponse;
import com.neuroforge.entity.Task;

public interface TriageService {

    AiTriageResponse autoTriageTask(Long taskId);

    void autoTriageTaskAsync(Long taskId);

    AiTriageResponse getTriageSuggestion(Long taskId);

    Task acceptTriageSuggestion(Long taskId);

    Task overrideTriageSuggestion(Long taskId, AiTriageOverrideRequest request);
}
