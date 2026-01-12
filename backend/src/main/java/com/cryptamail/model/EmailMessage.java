package com.cryptamail.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "email_messages")
public class EmailMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false)
    private Long recipientId;

    @Column(nullable = false, length = 4096)
    private String encryptedSubject;

    @Column(nullable = false, length = 256)
    private String subjectIv;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String encryptedBody;

    @Column(nullable = false, length = 256)
    private String bodyIv;

    @Column(nullable = false, length = 1024)
    private String encryptedSymmetricKey;

    @Column(nullable = false, length = 1024)
    private String senderEncryptedSymmetricKey;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false)
    private boolean isDraft = false;

    @Column(nullable = false)
    private boolean deletedBySender = false;

    @Column(nullable = false)
    private boolean deletedByRecipient = false;

    @Column(nullable = false)
    private boolean permanentlyDeletedBySender = false;

@Column(nullable = false)
    private boolean permanentlyDeletedByRecipient = false;

    @Column(nullable = false)
    private boolean isSpam = false;

    @Column(name = "spam_marked_at")
    private LocalDateTime spamMarkedAt;

    /* ---------------- ATTACHMENTS ---------------- */

    @ManyToMany(fetch = FetchType.LAZY)
    @Fetch(FetchMode.SUBSELECT)
    @JoinTable(
            name = "email_attachments",
            joinColumns = @JoinColumn(name = "email_id"),
            inverseJoinColumns = @JoinColumn(name = "attachment_id")
    )
    private List<Attachment> attachments = new ArrayList<>();

    /* ---------------- CLOUD FILES ---------------- */

    @ManyToMany(fetch = FetchType.LAZY)
    @Fetch(FetchMode.SUBSELECT)
    @JoinTable(
            name = "email_cloud_files",
            joinColumns = @JoinColumn(name = "email_id"),
            inverseJoinColumns = @JoinColumn(name = "cloud_file_id")
    )
    private List<CloudFile> cloudFiles = new ArrayList<>();

    /* ---------------- GETTERS & SETTERS ---------------- */

    public Long getId() {
        return id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public String getEncryptedSubject() {
        return encryptedSubject;
    }

    public void setEncryptedSubject(String encryptedSubject) {
        this.encryptedSubject = encryptedSubject;
    }

    public String getSubjectIv() {
        return subjectIv;
    }

    public void setSubjectIv(String subjectIv) {
        this.subjectIv = subjectIv;
    }

    public String getEncryptedBody() {
        return encryptedBody;
    }

    public void setEncryptedBody(String encryptedBody) {
        this.encryptedBody = encryptedBody;
    }

    public String getBodyIv() {
        return bodyIv;
    }

    public void setBodyIv(String bodyIv) {
        this.bodyIv = bodyIv;
    }

    public String getEncryptedSymmetricKey() {
        return encryptedSymmetricKey;
    }

    public void setEncryptedSymmetricKey(String encryptedSymmetricKey) {
        this.encryptedSymmetricKey = encryptedSymmetricKey;
    }

    public String getSenderEncryptedSymmetricKey() {
        return senderEncryptedSymmetricKey;
    }

    public void setSenderEncryptedSymmetricKey(String senderEncryptedSymmetricKey) {
        this.senderEncryptedSymmetricKey = senderEncryptedSymmetricKey;
    }

public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    // getCreatedAt method for compilation compatibility
    public LocalDateTime getCreatedAt() {
        return timestamp;
    }

    public boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(boolean read) {
        isRead = read;
    }

    public boolean getIsDraft() {
        return isDraft;
    }

    public void setIsDraft(boolean draft) {
        isDraft = draft;
    }

    public boolean getDeletedBySender() {
        return deletedBySender;
    }

    public void setDeletedBySender(boolean deletedBySender) {
        this.deletedBySender = deletedBySender;
    }

    public boolean getDeletedByRecipient() {
        return deletedByRecipient;
    }

    public void setDeletedByRecipient(boolean deletedByRecipient) {
        this.deletedByRecipient = deletedByRecipient;
    }

    public boolean getPermanentlyDeletedBySender() {
        return permanentlyDeletedBySender;
    }

    public void setPermanentlyDeletedBySender(boolean permanentlyDeletedBySender) {
        this.permanentlyDeletedBySender = permanentlyDeletedBySender;
    }

    public boolean getPermanentlyDeletedByRecipient() {
        return permanentlyDeletedByRecipient;
    }

    public void setPermanentlyDeletedByRecipient(boolean permanentlyDeletedByRecipient) {
        this.permanentlyDeletedByRecipient = permanentlyDeletedByRecipient;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }

    public List<CloudFile> getCloudFiles() {
        return cloudFiles;
    }

    public void setCloudFiles(List<CloudFile> cloudFiles) {
        this.cloudFiles = cloudFiles;
    }

    public boolean getIsSpam() {
        return isSpam;
    }

    public void setIsSpam(boolean spam) {
        isSpam = spam;
    }

    public LocalDateTime getSpamMarkedAt() {
        return spamMarkedAt;
    }

    public void setSpamMarkedAt(LocalDateTime spamMarkedAt) {
        this.spamMarkedAt = spamMarkedAt;
    }
}
