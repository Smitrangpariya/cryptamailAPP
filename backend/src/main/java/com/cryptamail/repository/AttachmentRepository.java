package com.cryptamail.repository;

import com.cryptamail.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    @Query("SELECT a FROM Attachment a WHERE a.status != 'COMPLETED' AND a.createdAt < :threshold")
    List<Attachment> findStaleAttachments(@Param("threshold") LocalDateTime threshold);

    @Query("""
        SELECT COUNT(e) > 0 FROM EmailMessage e
        JOIN e.attachments a
        WHERE a.id = :attachmentId
          AND e.isDraft = false
          AND (e.senderId = (SELECT u.id FROM User u WHERE u.username = :username)
           OR  e.recipientId = (SELECT u.id FROM User u WHERE u.username = :username))
    """)
    boolean isLinkedToUserEmail(@Param("attachmentId") Long attachmentId, @Param("username") String username);

    List<Attachment> findByUploaderId(Long uploaderId);
}