package com.cryptamail.repository;

import com.cryptamail.model.EmailMessage;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface EmailRepository extends JpaRepository<EmailMessage, Long> {
    @Query("SELECT e FROM EmailMessage e WHERE e.recipientId = ?1 AND e.isDraft = false AND e.deletedByRecipient = false")
    List<EmailMessage> findInbox(Long userId);

    @Query("SELECT e FROM EmailMessage e WHERE e.senderId = ?1 AND e.isDraft = false AND e.deletedBySender = false")
    List<EmailMessage> findSent(Long userId);

    @Query("SELECT e FROM EmailMessage e WHERE e.senderId = ?1 AND e.isDraft = true")
    List<EmailMessage> findDrafts(Long userId);

    @Query("SELECT e FROM EmailMessage e WHERE (e.senderId = ?1 OR e.recipientId = ?1) AND " +
           "((e.senderId = ?1 AND e.deletedBySender = true AND e.permanentlyDeletedBySender = false) OR " +
           "(e.recipientId = ?1 AND e.deletedByRecipient = true AND e.permanentlyDeletedByRecipient = false))")
    List<EmailMessage> findTrash(Long userId);

    @Query("SELECT e FROM EmailMessage e WHERE (e.senderId = ?1 OR e.recipientId = ?1) AND " +
           "((e.senderId = ?1 AND e.deletedBySender = true AND e.permanentlyDeletedBySender = false) OR " +
           "(e.recipientId = ?1 AND e.deletedByRecipient = true AND e.permanentlyDeletedByRecipient = false))")
    List<EmailMessage> findUserTrash(Long userId);

    List<EmailMessage> findAllBySenderIdOrRecipientId(Long senderId, Long recipientId);

    @Query("SELECT e FROM EmailMessage e WHERE e.recipientId = ?1 AND e.isSpam = true AND e.deletedByRecipient = false ORDER BY e.timestamp DESC")
    List<EmailMessage> findSpam(Long userId);

    @Query("SELECT e FROM EmailMessage e WHERE e.isSpam = true AND e.spamMarkedAt < ?1")
    List<EmailMessage> findSpamOlderThan(LocalDateTime cutoff);

    
}