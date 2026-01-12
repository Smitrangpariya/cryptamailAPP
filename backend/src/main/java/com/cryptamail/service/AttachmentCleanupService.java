package com.cryptamail.service;

import com.cryptamail.model.Attachment;
import com.cryptamail.model.User;
import com.cryptamail.repository.AttachmentChunkRepository;
import com.cryptamail.repository.AttachmentRepository;
import com.cryptamail.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttachmentCleanupService {

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private AttachmentChunkRepository chunkRepository;
    
    @Autowired
    private UserRepository userRepository;

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupStaleAttachments() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24); // 24 hours retention for incomplete uploads
        List<Attachment> staleAttachments = attachmentRepository.findStaleAttachments(threshold);

        for (Attachment attachment : staleAttachments) {
            // 1. Delete chunks (Hard delete to free space)
            // chunkRepository.deleteAllByAttachmentId(attachment.getId()); 
            // Better to iterate or use bulk delete if defined. 
            // For now, let's fetch and delete or define a delete method in repo.
            // Using standard JPA deleteInBatch if list is loaded, or custom query.
            var chunks = chunkRepository.findByAttachmentIdOrderByChunkIndexAsc(attachment.getId());
            chunkRepository.deleteAllInBatch(chunks);

            // 2. Release Quota if reserved
            if (Boolean.TRUE.equals(attachment.getQuotaReserved())) {
                User uploader = attachment.getUploader();
                uploader.setStorageUsed(Math.max(0, uploader.getStorageUsed() - attachment.getTotalSize()));
                userRepository.save(uploader);
            }

            // 3. Mark as FAILED or Delete? 
            // User requirement: "Delete chunks, Release reserved quota".
            // Doesn't explicitly say delete Attachment entity, but implied "Cleanup".
            // Set status to FAILED or hard delete?
            // "Scheduled task... Delete chunks... Release reserved quota".
            // If we delete chunks and release quota, the attachment is useless.
            // We should probably delete the attachment entity too or mark FAILED.
            // I'll delete it to keep DB clean.
            attachmentRepository.delete(attachment);
        }
    }
}
