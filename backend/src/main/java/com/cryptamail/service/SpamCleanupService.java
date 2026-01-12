package com.cryptamail.service;

import com.cryptamail.model.EmailMessage;
import com.cryptamail.repository.EmailRepository;
import com.cryptamail.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SpamCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(SpamCleanupService.class);
    
    private final EmailRepository emailRepository;
    private final AttachmentService attachmentService;

    public SpamCleanupService(EmailRepository emailRepository, AttachmentService attachmentService) {
        this.emailRepository = emailRepository;
        this.attachmentService = attachmentService;
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupOldSpam() {
        logger.info("Starting spam cleanup job...");
        
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        List<EmailMessage> oldSpamEmails = emailRepository.findSpamOlderThan(cutoff);
        
        int deletedCount = 0;
        long totalSizeReclaimed = 0;
        
        for (EmailMessage email : oldSpamEmails) {
            try {
                // Delete attachments and reclaim storage
                if (email.getAttachments() != null) {
                    for (var attachment : email.getAttachments()) {
                        try {
                            // Get the uploader's username for authorization
                            String uploaderUsername = attachment.getUploader().getUsername();
                            attachmentService.deleteAttachment(attachment.getId(), uploaderUsername);
                            totalSizeReclaimed += attachment.getTotalSize();
                        } catch (Exception e) {
                            logger.warn("Failed to delete attachment {} for email {}: {}", 
                                attachment.getId(), email.getId(), e.getMessage());
                        }
                    }
                }
                
                // Delete cloud files
                if (email.getCloudFiles() != null) {
                    for (var cloudFile : email.getCloudFiles()) {
                        try {
                            // Cloud files will be automatically cleaned up by their expiration mechanism
                            logger.debug("Cloud file {} will be cleaned up by expiration", cloudFile.getId());
                        } catch (Exception e) {
                            logger.warn("Failed to process cloud file {} for email {}: {}", 
                                cloudFile.getId(), email.getId(), e.getMessage());
                        }
                    }
                }
                
                // Hard delete the email
                emailRepository.delete(email);
                deletedCount++;
                
            } catch (Exception e) {
                logger.error("Failed to delete spam email {}: {}", email.getId(), e.getMessage());
            }
        }
        
        logger.info("Spam cleanup completed. Deleted {} spam emails, reclaimed {} bytes of storage", 
            deletedCount, totalSizeReclaimed);
    }
}