package com.cryptamail.dto;

import com.cryptamail.model.EmailMessage;
import com.cryptamail.model.Attachment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailDto {

    private Long id;
    private String fromUsername;
    private String toUsername;

    private String encryptedSubject;
    private String subjectIv;

    private String encryptedBody;
    private String bodyIv;

    private String encryptedSymmetricKey;
    private String senderEncryptedSymmetricKey;

    private LocalDateTime timestamp;
    private Boolean isRead;
    private Boolean isSender;
    private List<Long> attachmentIds;

    /**
     * ✅ ADDED THIS CONSTRUCTOR
     * Maps EmailMessage Entity to EmailDto
     */
    public EmailDto(EmailMessage message) {
        this.id = message.getId();
        // Note: EmailMessage stores IDs. The service layer should set actual usernames
        // For now, using placeholder format that will be replaced by service
        this.fromUsername = "loading..."; 
        this.toUsername = "loading...";
        
        this.encryptedSubject = message.getEncryptedSubject();
        this.subjectIv = message.getSubjectIv();
        this.encryptedBody = message.getEncryptedBody();
        this.bodyIv = message.getBodyIv();
        this.encryptedSymmetricKey = message.getEncryptedSymmetricKey();
        this.senderEncryptedSymmetricKey = message.getSenderEncryptedSymmetricKey();
        
        this.timestamp = message.getCreatedAt();
        this.isRead = message.getIsRead();
        this.isSender = false; // Default, service will update this logic
        
        // Don't access collections in constructor to avoid lazy loading issues
        // Collections will be set in service layer
        this.attachmentIds = null;
    }
    
    // Add setters for manual username setting
    public void setFromUsername(String fromUsername) {
        this.fromUsername = fromUsername;
    }
    
    public void setToUsername(String toUsername) {
        this.toUsername = toUsername;
    }
    
    public void setIsSender(Boolean isSender) {
        this.isSender = isSender;
    }
}