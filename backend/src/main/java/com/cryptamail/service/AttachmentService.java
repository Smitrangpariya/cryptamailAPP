package com.cryptamail.service;

import com.cryptamail.dto.AttachmentStatusResponse;
import com.cryptamail.dto.InitAttachmentRequest;
import com.cryptamail.dto.UploadChunkRequest;
import com.cryptamail.model.Attachment;
import com.cryptamail.model.AttachmentChunk;
import com.cryptamail.model.AttachmentStatus;
import com.cryptamail.model.User;
import com.cryptamail.repository.AttachmentChunkRepository;
import com.cryptamail.repository.AttachmentRepository;
import com.cryptamail.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final AttachmentChunkRepository chunkRepository;
    private final UserRepository userRepository;

    public AttachmentService(
            AttachmentRepository attachmentRepository,
            AttachmentChunkRepository chunkRepository,
            UserRepository userRepository
    ) {
        this.attachmentRepository = attachmentRepository;
        this.chunkRepository = chunkRepository;
        this.userRepository = userRepository;
    }

    /* =========================================================
       INIT UPLOAD
       ========================================================= */
    @Transactional
    public Attachment initUpload(String username, InitAttachmentRequest request) {
        username = username.toLowerCase().trim();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Validate file size
        if (request.getTotalSize() > 1073741824L) { // 1GB (individual file limit)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "File size cannot exceed 1GB. For larger files, consider using cloud storage.");
        }

        Attachment attachment = new Attachment();
        attachment.setStatus(AttachmentStatus.INIT);
        attachment.setTotalSize(request.getTotalSize());
        attachment.setTotalChunks(request.getTotalChunks());

        // Store plain filename as encrypted filename if not provided encrypted version
        if (request.getEncryptedFilename() != null && !request.getEncryptedFilename().isEmpty()) {
            attachment.setEncryptedFilename(request.getEncryptedFilename());
            attachment.setFilenameIv(request.getFilenameIv());
        } else if (request.getFilename() != null && !request.getFilename().isEmpty()) {
            // Store plain filename temporarily (should be encrypted by frontend in production)
            attachment.setEncryptedFilename(request.getFilename());
        }

        attachment.setEncryptedKeySender(request.getEncryptedKeySender());
        attachment.setEncryptedKeyRecipient(request.getEncryptedKeyRecipient());
        attachment.setMimeType(request.getMimeType() != null ? request.getMimeType() : "application/octet-stream");
        attachment.setUploader(user);
        attachment.setCreatedAt(LocalDateTime.now());
        attachment.setDeleted(false);

        attachmentRepository.save(attachment);

        user.setStorageUsed(user.getStorageUsed() + request.getTotalSize());
        userRepository.save(user);

        return attachment;
    }

    /* =========================================================
       UPLOAD CHUNK (IDEMPOTENT)
       ========================================================= */
    @Transactional
    public void uploadChunk(Long attachmentId, UploadChunkRequest request, String username) {
        try {
            // Validate request
            if (request == null || request.getChunkIndex() == null || request.getEncryptedData() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid chunk request");
            }

            Attachment attachment = getOwnedAttachment(attachmentId, username);

            // Check if chunk already exists (idempotent)
            if (chunkRepository.existsByAttachmentIdAndChunkIndex(attachmentId, request.getChunkIndex())) {
                return; // Already uploaded, skip
            }

            // Validate and decode Base64 encrypted data
            String encryptedDataB64 = request.getEncryptedData();
            if (encryptedDataB64 == null || encryptedDataB64.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Encrypted data cannot be empty");
            }

            byte[] encryptedData;
            try {
                encryptedData = Base64.getDecoder().decode(encryptedDataB64);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Base64 encoded data");
            }

            // Validate IV
            String iv = request.getIv();
            if (iv == null || iv.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "IV cannot be empty");
            }

            // Try to decode IV as well to validate it's valid Base64
            try {
                Base64.getDecoder().decode(iv);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Base64 encoded IV");
            }

            // Create and save chunk
            AttachmentChunk chunk = new AttachmentChunk();
            chunk.setAttachment(attachment);
            chunk.setChunkIndex(request.getChunkIndex());
            chunk.setEncryptedData(encryptedData); // Store as bytes
            chunk.setIv(iv); // Store as Base64 string
            chunk.setSize(request.getSize() != null ? request.getSize() : (long) encryptedData.length);

            chunkRepository.save(chunk);

            // Update attachment status
            if (attachment.getStatus() == AttachmentStatus.INIT) {
                attachment.setStatus(AttachmentStatus.UPLOADING);
                attachmentRepository.save(attachment);
            }

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error uploading chunk: " + e.getMessage());
        }
    }

    /* =========================================================
       STATUS (RESUME SUPPORT)
       ========================================================= */
    @Transactional(readOnly = true)
    public AttachmentStatusResponse getStatus(Long attachmentId, String username) {
        Attachment attachment = getOwnedAttachment(attachmentId, username);

        List<Integer> uploaded = chunkRepository
                .findByAttachmentIdOrderByChunkIndexAsc(attachmentId)
                .stream()
                .map(AttachmentChunk::getChunkIndex)
                .collect(Collectors.toList());

        return new AttachmentStatusResponse(
                attachment.getStatus().name(),
                attachment.getTotalChunks(),
                uploaded
        );
    }

    /* =========================================================
       COMPLETE UPLOAD
       ========================================================= */
    @Transactional
    public void completeUpload(Long attachmentId, String username) {
        Attachment attachment = getOwnedAttachment(attachmentId, username);

        long uploaded = chunkRepository.countByAttachmentId(attachmentId);
        if (uploaded != attachment.getTotalChunks()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Missing chunks");
        }

        attachment.setStatus(AttachmentStatus.COMPLETED);
        attachmentRepository.save(attachment);
    }

    /* =========================================================
       DOWNLOAD CHUNK (RECIPIENT + SENDER)
       ========================================================= */
    @Transactional(readOnly = true)
    public UploadChunkRequest getChunk(Long attachmentId, Integer index, String username) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        // Check if user is the uploader
        boolean isUploader = attachment.getUploader() != null &&
                            attachment.getUploader().getUsername() != null &&
                            attachment.getUploader().getUsername().equalsIgnoreCase(username);

        if (!isUploader) {
            // Check if user is linked to this attachment via email
            boolean isLinked = attachmentRepository.isLinkedToUserEmail(attachmentId, username.toLowerCase());

            if (!isLinked) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Unauthorized: You do not have access to this attachment");
            }
        }

        AttachmentChunk chunk = chunkRepository
                .findByAttachmentIdAndChunkIndex(attachmentId, index)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Chunk not found"));

        UploadChunkRequest dto = new UploadChunkRequest();
        dto.setChunkIndex(chunk.getChunkIndex());
        // Convert bytes to Base64 for transmission
        dto.setEncryptedData(Base64.getEncoder().encodeToString(chunk.getEncryptedData()));
        dto.setIv(chunk.getIv()); // Already stored as Base64
        dto.setSize(chunk.getSize());
        return dto;
    }

    /* =========================================================
       METADATA (LAZY LOAD SAFE)
       ========================================================= */
    @Transactional(readOnly = true)
    public Attachment getAttachmentMetadata(Long id, String username) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        // Check if user is the uploader
        boolean isUploader = attachment.getUploader() != null &&
                            attachment.getUploader().getUsername() != null &&
                            attachment.getUploader().getUsername().equalsIgnoreCase(username);

        if (!isUploader) {
            // Check if user is linked to this attachment via email
            boolean isLinked = attachmentRepository.isLinkedToUserEmail(id, username.toLowerCase());

            if (!isLinked) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Unauthorized: You do not have access to this attachment");
            }
        }

        // Don't load chunks for efficiency
        attachment.setChunks(null);
        return attachment;
    }

    /* =========================================================
       DELETE + QUOTA RECLAIM
       ========================================================= */
    @Transactional
    public void deleteAttachment(Long id, String username) {
        Attachment attachment = getOwnedAttachment(id, username);

        if (attachment.isDeleted()) return;

        chunkRepository.deleteByAttachmentId(id);

        User user = attachment.getUploader();
        user.setStorageUsed(
                Math.max(0, user.getStorageUsed() - attachment.getTotalSize())
        );
        userRepository.save(user);

        attachment.setDeleted(true);
        attachmentRepository.save(attachment);
    }

    /* =========================================================
       HELPERS
       ========================================================= */
    private Attachment getOwnedAttachment(Long id, String username) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        if (!attachment.getUploader().getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        return attachment;
    }
}
