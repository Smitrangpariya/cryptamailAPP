package com.cryptamail.controller;

import com.cryptamail.dto.AttachmentStatusResponse;
import com.cryptamail.dto.InitAttachmentRequest;
import com.cryptamail.dto.UploadChunkRequest;
import com.cryptamail.model.Attachment;
import com.cryptamail.service.AttachmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping("/init")
    public ResponseEntity<?> initUpload(
            @RequestBody InitAttachmentRequest request,
            Authentication auth) {

        Attachment attachment =
                attachmentService.initUpload(auth.getName(), request);

        return ResponseEntity.ok(Map.of(
                "id", attachment.getId(),
                "status", attachment.getStatus(),
                "totalChunks", attachment.getTotalChunks()
        ));
    }

    @PostMapping("/{id}/chunk")
    public ResponseEntity<?> uploadChunk(
            @PathVariable Long id,
            @RequestBody UploadChunkRequest request,
            Authentication auth) {

        attachmentService.uploadChunk(id, request, auth.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<AttachmentStatusResponse> getStatus(
            @PathVariable Long id,
            Authentication auth) {

        return ResponseEntity.ok(
                attachmentService.getStatus(id, auth.getName())
        );
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeUpload(
            @PathVariable Long id,
            Authentication auth) {

        attachmentService.completeUpload(id, auth.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/chunks/{index}")
    public ResponseEntity<UploadChunkRequest> getChunk(
            @PathVariable Long id,
            @PathVariable Integer index,
            Authentication auth) {

        return ResponseEntity.ok(
                attachmentService.getChunk(id, index, auth.getName())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMetadata(
            @PathVariable Long id,
            Authentication auth
    ) {
        try {
            Attachment att =
                    attachmentService.getAttachmentMetadata(id, auth.getName());

            return ResponseEntity.ok(Map.of(
                    "id", att.getId(),
                    "status", att.getStatus(),
                    "totalChunks", att.getTotalChunks(),
                    "totalSize", att.getTotalSize(),
                    "mimeType", att.getMimeType() != null ? att.getMimeType() : "application/octet-stream",
                    "encryptedFilename", att.getEncryptedFilename() != null ? att.getEncryptedFilename() : "",
                    "filenameIv", att.getFilenameIv() != null ? att.getFilenameIv() : "",
                    "encryptedKeySender", att.getEncryptedKeySender() != null ? att.getEncryptedKeySender() : "",
                    "encryptedKeyRecipient", att.getEncryptedKeyRecipient() != null ? att.getEncryptedKeyRecipient() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "Attachment not found or access denied",
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttachment(
            @PathVariable Long id,
            Authentication auth) {

        attachmentService.deleteAttachment(id, auth.getName());
        return ResponseEntity.ok().build();
    }
}
