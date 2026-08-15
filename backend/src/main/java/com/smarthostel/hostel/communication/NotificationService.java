package com.smarthostel.hostel.communication;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendToUser(Long userId, String message) {
        // Send a message to /topic/user/{userId}
        messagingTemplate.convertAndSend("/topic/user/" + userId, new NotificationMessage(message));
    }

    public void sendToAll(String message) {
        messagingTemplate.convertAndSend("/topic/broadcast", new NotificationMessage(message));
    }

    public static class NotificationMessage {
        private String content;

        public NotificationMessage(String content) {
            this.content = content;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
