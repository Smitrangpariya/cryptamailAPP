package com.cryptamail.service;

import com.cryptamail.dto.EmailDto;
import com.cryptamail.dto.SendEmailRequest;
import com.cryptamail.model.EmailMessage;
import com.cryptamail.model.User;
import com.cryptamail.model.CloudFile;
import com.cryptamail.model.Attachment;
import com.cryptamail.repository.AttachmentRepository;
import com.cryptamail.repository.EmailRepository;
import com.cryptamail.repository.UserRepository;
import com.cryptamail.repository.CloudFileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmailService {

    private final EmailRepository emailRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final CloudFileRepository cloudFileRepository;

    public EmailService(
            EmailRepository emailRepository,
            UserRepository userRepository,
            AttachmentRepository attachmentRepository,
            CloudFileRepository cloudFileRepository
    ) {
        this.emailRepository = emailRepository;
        this.userRepository = userRepository;
        this.attachmentRepository = attachmentRepository;
        this.cloudFileRepository = cloudFileRepository;
    }

    @Transactional
    public EmailMessage sendEmail(SendEmailRequest req, String senderUsername) {
        User sender = userRepository.findByUsername(senderUsername).orElseThrow();
        
        // Extract username from email or username
        String toUsername = req.getToUsername().trim();
        if (toUsername.isEmpty()) {
            throw new IllegalArgumentException("Invalid recipient email format");
        }
        
        // Handle both full email and username formats
        String to;
        if (toUsername.contains("@")) {
            String[] emailParts = toUsername.split("@");
            if (emailParts.length != 2 || emailParts[0].trim().isEmpty()) {
                throw new IllegalArgumentException("Invalid recipient email format");
            }
            to = emailParts[0].trim().toLowerCase();
        } else {
            // Already just username
            to = toUsername.toLowerCase();
        }
        if (to.length() > 50) {
            throw new IllegalArgumentException("Recipient username too long");
        }
        
        User recipient = userRepository.findByUsername(to).orElseThrow();

        EmailMessage email = new EmailMessage();
        email.setSenderId(sender.getId());
        email.setRecipientId(recipient.getId());
        email.setIsDraft(false);
        email.setEncryptedSubject(req.getEncryptedSubject());
        email.setSubjectIv(req.getSubjectIv());
        email.setEncryptedBody(req.getEncryptedBody());
        email.setBodyIv(req.getBodyIv());
        email.setEncryptedSymmetricKey(req.getEncryptedSymmetricKey());
        email.setSenderEncryptedSymmetricKey(req.getSenderEncryptedSymmetricKey());

        // Apply rule-based spam detection
        boolean isSpam = false;
        LocalDateTime now = LocalDateTime.now();
        
        // Rule 1: First-time sender
        List<EmailMessage> previousEmails = emailRepository.findAllBySenderIdOrRecipientId(sender.getId(), recipient.getId());
        boolean isFirstTimeSender = previousEmails.stream()
            .noneMatch(e -> e.getSenderId().equals(sender.getId()) && e.getRecipientId().equals(recipient.getId()));
        
        if (isFirstTimeSender) {
            isSpam = true;
        }
        
        // Rule 2: Attachments from unknown sender
        if ((req.getAttachmentIds() != null && !req.getAttachmentIds().isEmpty()) ||
            (req.getCloudFileIds() != null && !req.getCloudFileIds().isEmpty())) {
            if (isFirstTimeSender) {
                isSpam = true;
            }
        }
        
        // Rule 3: Rate-limit violations (simplified - check for multiple emails to same recipient in last hour)
        List<EmailMessage> recentEmails = emailRepository.findAllBySenderIdOrRecipientId(sender.getId(), recipient.getId()).stream()
            .filter(e -> e.getTimestamp().isAfter(now.minusHours(1)))
            .collect(Collectors.toList());
        
        if (recentEmails.size() >= 5) {
            isSpam = true;
        }
        
        // Set spam status
        if (isSpam) {
            email.setIsSpam(true);
            email.setSpamMarkedAt(now);
        }

        if (req.getAttachmentIds() != null && !req.getAttachmentIds().isEmpty()) {
            List<Attachment> attachments = attachmentRepository.findAllById(req.getAttachmentIds());

            // Attachments already have their own keys set during upload init
            // No need to overwrite them with email keys

            attachmentRepository.saveAll(attachments);
            email.setAttachments(attachments);
        }

        if (req.getCloudFileIds() != null && !req.getCloudFileIds().isEmpty()) {
            List<CloudFile> cloudFiles = cloudFileRepository.findAllById(req.getCloudFileIds());
            
            // Verify user owns all cloud files
            for (CloudFile cloudFile : cloudFiles) {
                if (!cloudFile.getUploaderId().equals(sender.getId())) {
                    throw new SecurityException("Unauthorized: You can only attach your own cloud files");
                }
                if (cloudFile.isExpired()) {
                    throw new SecurityException("Cloud file has expired: " + cloudFile.getOriginalFilename());
                }
            }
            
            email.setCloudFiles(cloudFiles);
        }
        
        return emailRepository.save(email);
    }

    @Transactional
    public EmailMessage saveDraft(SendEmailRequest req, String username) {
        User sender = userRepository.findByUsername(username).orElseThrow();
        EmailMessage draft = new EmailMessage();
        draft.setSenderId(sender.getId());
        draft.setRecipientId(sender.getId());
        draft.setIsDraft(true);
        draft.setEncryptedSubject(req.getEncryptedSubject());
        draft.setSubjectIv(req.getSubjectIv());
        draft.setEncryptedBody(req.getEncryptedBody());
        draft.setBodyIv(req.getBodyIv());
        draft.setSenderEncryptedSymmetricKey(req.getSenderEncryptedSymmetricKey());

        if (req.getAttachmentIds() != null) {
            List<Attachment> attachments = attachmentRepository.findAllById(req.getAttachmentIds());

            // Attachments already have their own keys set during upload init
            // No need to overwrite them with email keys

            attachmentRepository.saveAll(attachments);
            draft.setAttachments(attachments);
        }

        if (req.getCloudFileIds() != null) {
            List<CloudFile> cloudFiles = cloudFileRepository.findAllById(req.getCloudFileIds());
            
            // Verify user owns all cloud files
            for (CloudFile cloudFile : cloudFiles) {
                if (!cloudFile.getUploaderId().equals(sender.getId())) {
                    throw new SecurityException("Unauthorized: You can only attach your own cloud files");
                }
                if (cloudFile.isExpired()) {
                    throw new SecurityException("Cloud file has expired: " + cloudFile.getOriginalFilename());
                }
            }
            
            draft.setCloudFiles(cloudFiles);
        }
        
        return emailRepository.save(draft);
    }

@Transactional
    public List<EmailDto> getInbox(String username) {
        User u = userRepository.findByUsername(username).orElseThrow();
        return emailRepository.findInbox(u.getId())
                .stream().map(e -> {
                    EmailDto dto = new EmailDto(e);
                    // Set actual usernames instead of IDs
                    User sender = userRepository.findById(e.getSenderId()).orElse(null);
                    User recipient = userRepository.findById(e.getRecipientId()).orElse(null);
                    dto.setFromUsername(sender != null ? sender.getUsername() : "unknown");
                    dto.setToUsername(recipient != null ? recipient.getUsername() : "unknown");
                    
                    // Set isSender flag - false for inbox (user is always recipient)
                    dto.setIsSender(false);
                    
                    // Handle attachments within transaction
                    if (e.getAttachments() != null) {
                        dto.setAttachmentIds(e.getAttachments().stream()
                                .map(Attachment::getId)
                                .collect(Collectors.toList()));
                    }
                    
                    return dto;
                }).collect(Collectors.toList());
    }

@Transactional
    public List<EmailDto> getSent(String username) {
        User u = userRepository.findByUsername(username).orElseThrow();
        return emailRepository.findSent(u.getId())
                .stream().map(e -> {
                    EmailDto dto = new EmailDto(e);
                    // Set actual usernames instead of IDs
                    User sender = userRepository.findById(e.getSenderId()).orElse(null);
                    User recipient = userRepository.findById(e.getRecipientId()).orElse(null);
                    dto.setFromUsername(sender != null ? sender.getUsername() : "unknown");
                    dto.setToUsername(recipient != null ? recipient.getUsername() : "unknown");
                    
                    // Set isSender flag - true for sent (user is always sender)
                    dto.setIsSender(true);
                    
                    // Handle attachments within transaction
                    if (e.getAttachments() != null) {
                        dto.setAttachmentIds(e.getAttachments().stream()
                                .map(Attachment::getId)
                                .collect(Collectors.toList()));
                    }
                    
                    return dto;
                }).collect(Collectors.toList());
    }

public List<EmailDto> getDrafts(String username) {
        User u = userRepository.findByUsername(username).orElseThrow();
        return emailRepository.findDrafts(u.getId())
                .stream().map(e -> {
                    EmailDto dto = new EmailDto(e);
                    // Set actual usernames instead of IDs
                    User sender = userRepository.findById(e.getSenderId()).orElse(null);
                    User recipient = userRepository.findById(e.getRecipientId()).orElse(null);
                    dto.setFromUsername(sender != null ? sender.getUsername() : "unknown");
                    dto.setToUsername(recipient != null ? recipient.getUsername() : "unknown");
                    
                    // Set isSender flag - true for drafts (user is sender)
                    dto.setIsSender(true);
                    
                    // Handle attachments within transaction
                    if (e.getAttachments() != null) {
                        dto.setAttachmentIds(e.getAttachments().stream()
                                .map(Attachment::getId)
                                .collect(Collectors.toList()));
                    }
                    
                    return dto;
                }).collect(Collectors.toList());
    }

@Transactional
    public List<EmailDto> getTrash(String username) {
        User u = userRepository.findByUsername(username).orElseThrow();
        return emailRepository.findTrash(u.getId())
                .stream().map(e -> {
                    EmailDto dto = new EmailDto(e);
                    // Set actual usernames instead of IDs
                    User sender = userRepository.findById(e.getSenderId()).orElse(null);
                    User recipient = userRepository.findById(e.getRecipientId()).orElse(null);
                    dto.setFromUsername(sender != null ? sender.getUsername() : "unknown");
                    dto.setToUsername(recipient != null ? recipient.getUsername() : "unknown");
                    
                    // Set isSender flag - true if user is the sender
                    dto.setIsSender(e.getSenderId().equals(u.getId()));
                    
                    // Handle attachments within transaction
                    if (e.getAttachments() != null) {
                        dto.setAttachmentIds(e.getAttachments().stream()
                                .map(Attachment::getId)
                                .collect(Collectors.toList()));
                    }
                    
                    return dto;
                }).collect(Collectors.toList());
    }

@Transactional
    public void markAsRead(Long id, String username) {
        EmailMessage email = emailRepository.findById(id).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        // Authorization check: only recipient can mark email as read
        if (!email.getRecipientId().equals(user.getId())) {
            throw new SecurityException("Unauthorized: You can only mark your own emails as read");
        }
        
        email.setIsRead(true);
        emailRepository.save(email);
    }

@Transactional
    public void deleteEmail(Long id, String username) {
        EmailMessage email = emailRepository.findById(id).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        // Authorization check: only sender or recipient can delete email
        if (!email.getSenderId().equals(user.getId()) && !email.getRecipientId().equals(user.getId())) {
            throw new SecurityException("Unauthorized: You can only delete your own emails");
        }
        
        // Soft delete: mark as deleted by appropriate party
        if (email.getSenderId().equals(user.getId())) {
            email.setDeletedBySender(true);
        }
        if (email.getRecipientId().equals(user.getId())) {
            email.setDeletedByRecipient(true);
        }
        
        emailRepository.save(email);
    }

    @Transactional
    public void permanentlyDeleteEmail(Long id, String username) {
        EmailMessage email = emailRepository.findById(id).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        // Authorization check: only sender or recipient can permanently delete email
        if (!email.getSenderId().equals(user.getId()) && !email.getRecipientId().equals(user.getId())) {
            throw new SecurityException("Unauthorized: You can only permanently delete your own emails");
        }
        
        // Mark as permanently deleted by appropriate party
        if (email.getSenderId().equals(user.getId())) {
            email.setPermanentlyDeletedBySender(true);
        }
        if (email.getRecipientId().equals(user.getId())) {
            email.setPermanentlyDeletedByRecipient(true);
        }
        
        emailRepository.save(email);
    }

    @Transactional
    public int emptyTrash(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        List<EmailMessage> trashEmails = emailRepository.findTrash(user.getId());
        
        int deletedCount = 0;
        for (EmailMessage email : trashEmails) {
            // Mark as permanently deleted by this user
            if (email.getSenderId().equals(user.getId())) {
                email.setPermanentlyDeletedBySender(true);
            }
            if (email.getRecipientId().equals(user.getId())) {
                email.setPermanentlyDeletedByRecipient(true);
            }
            
            emailRepository.save(email);
            deletedCount++;
        }
        
        return deletedCount;
    }

    @Transactional
    public List<EmailDto> getSpam(String username) {
        User u = userRepository.findByUsername(username).orElseThrow();
        return emailRepository.findSpam(u.getId())
                .stream().map(e -> {
                    EmailDto dto = new EmailDto(e);
                    // Set actual usernames instead of IDs
                    User sender = userRepository.findById(e.getSenderId()).orElse(null);
                    User recipient = userRepository.findById(e.getRecipientId()).orElse(null);
                    dto.setFromUsername(sender != null ? sender.getUsername() : "unknown");
                    dto.setToUsername(recipient != null ? recipient.getUsername() : "unknown");
                    
                    // Set isSender flag - false for spam (user is always recipient)
                    dto.setIsSender(false);
                    
                    // Handle attachments within transaction
                    if (e.getAttachments() != null) {
                        dto.setAttachmentIds(e.getAttachments().stream()
                                .map(Attachment::getId)
                                .collect(Collectors.toList()));
                    }
                    
                    return dto;
                }).collect(Collectors.toList());
    }

    @Transactional
    public void markSpam(Long emailId, String username) {
        EmailMessage email = emailRepository.findById(emailId).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        // Authorization check: only recipient can mark email as spam
        if (!email.getRecipientId().equals(user.getId())) {
            throw new SecurityException("Unauthorized: You can only mark your own emails as spam");
        }
        
        email.setIsSpam(true);
        email.setSpamMarkedAt(LocalDateTime.now());
        emailRepository.save(email);
    }

    @Transactional
    public void markNotSpam(Long emailId, String username) {
        EmailMessage email = emailRepository.findById(emailId).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        // Authorization check: only recipient can mark email as not spam
        if (!email.getRecipientId().equals(user.getId())) {
            throw new SecurityException("Unauthorized: You can only mark your own emails as not spam");
        }
        
        email.setIsSpam(false);
        email.setSpamMarkedAt(null);
        emailRepository.save(email);
    }

    @Transactional
    public void restoreEmail(Long emailId, String username) {
        EmailMessage email = emailRepository.findById(emailId).orElseThrow();
        User user = userRepository.findByUsername(username).orElseThrow();
        
        // Authorization check: only sender or recipient can restore email
        if (!email.getSenderId().equals(user.getId()) && !email.getRecipientId().equals(user.getId())) {
            throw new SecurityException("Unauthorized: You can only restore your own emails");
        }
        
        // Restore: unmark as deleted by appropriate party
        if (email.getSenderId().equals(user.getId())) {
            email.setDeletedBySender(false);
        }
        if (email.getRecipientId().equals(user.getId())) {
            email.setDeletedByRecipient(false);
        }
        
        emailRepository.save(email);
    }
}