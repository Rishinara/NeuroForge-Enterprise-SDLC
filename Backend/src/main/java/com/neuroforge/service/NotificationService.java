package com.neuroforge.service;

import com.neuroforge.dto.notification.NotificationResponse;
import com.neuroforge.entity.Notification;
import com.neuroforge.entity.User;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.NotificationRepository;
import com.neuroforge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final com.neuroforge.repository.InviteRepository inviteRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, com.neuroforge.repository.InviteRepository inviteRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.inviteRepository = inviteRepository;
    }

    @Transactional
    public void createNotification(User user, String title, String message, String type, Long relatedId) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedId(relatedId);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(Long id, String email) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("Notification not found"); // Masking unauthorized access
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        String token = null;
        if ("TEAM_INVITE".equals(n.getType()) && n.getRelatedId() != null) {
            token = inviteRepository.findById(n.getRelatedId())
                    .map(com.neuroforge.entity.Invite::getToken)
                    .orElse(null);
        }
        return new NotificationResponse(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getType(),
                n.getRelatedId(),
                n.isRead(),
                n.getCreatedAt(),
                token
        );
    }
}
