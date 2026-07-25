package com.neuroforge.websocket;

import com.neuroforge.dto.websocket.TaskStatusUpdateEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishTaskStatusUpdate(TaskStatusUpdateEvent event) {

        messagingTemplate.convertAndSend(
                "/topic/sprints/" + event.getSprintId(),
                event
        );
    }
}