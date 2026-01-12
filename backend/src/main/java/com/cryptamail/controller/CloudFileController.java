package com.cryptamail.controller;

import com.cryptamail.model.CloudFile;
import com.cryptamail.service.CloudFileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cloud-files")
public class CloudFileController {

    private final CloudFileService cloudFileService;

    public CloudFileController(CloudFileService cloudFileService) {
        this.cloudFileService = cloudFileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        try {
            CloudFile cloudFile = cloudFileService.uploadFile(authentication.getName(), file);
            return ResponseEntity.ok(Map.of(
                "id", cloudFile.getId(),
                "originalFilename", cloudFile.getOriginalFilename(),
                "fileSize", cloudFile.getFileSize(),
                "mimeType", cloudFile.getMimeType(),
                "downloadUrl", cloudFile.getDownloadUrl(),
                "expiresAt", cloudFile.getExpiresAt()
            ));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to upload file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<CloudFile>> getUserFiles(Authentication authentication) {
        List<CloudFile> files = cloudFileService.getUserFiles(authentication.getName());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFileMetadata(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            CloudFile file = cloudFileService.getFileMetadata(id, authentication.getName());
            return ResponseEntity.ok(Map.of(
                "id", file.getId(),
                "originalFilename", file.getOriginalFilename(),
                "fileSize", file.getFileSize(),
                "mimeType", file.getMimeType(),
                "createdAt", file.getCreatedAt(),
                "expiresAt", file.getExpiresAt()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/download-url")
    public ResponseEntity<?> getDownloadUrl(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            String downloadUrl = cloudFileService.getDownloadUrl(id, authentication.getName());
            return ResponseEntity.ok(Map.of("downloadUrl", downloadUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(
            @PathVariable Long id,
            Authentication authentication) {
        
        try {
            cloudFileService.deleteFile(id, authentication.getName());
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/cleanup")
    public ResponseEntity<?> cleanupExpiredFiles() {
        int deletedCount = cloudFileService.cleanupExpiredFiles();
        return ResponseEntity.ok(Map.of(
            "message", "Cleanup completed",
            "deletedCount", deletedCount
        ));
    }
}