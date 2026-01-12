package com.cryptamail.service;

import com.cryptamail.model.CloudFile;
import com.cryptamail.model.User;
import com.cryptamail.repository.CloudFileRepository;
import com.cryptamail.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CloudFileService {

    private final CloudStorageService cloudStorageService;
    private final CloudFileRepository cloudFileRepository;
    private final UserRepository userRepository;

    @Autowired
    public CloudFileService(
            CloudStorageService cloudStorageService,
            CloudFileRepository cloudFileRepository,
            UserRepository userRepository
    ) {
        this.cloudStorageService = cloudStorageService;
        this.cloudFileRepository = cloudFileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CloudFile uploadFile(String username, MultipartFile file) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Validate file size (1GB limit per file)
        if (file.getSize() > 1073741824L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "File size exceeds 1GB limit");
        }

        // Generate unique storage key
        String storageKey = generateStorageKey(username, file.getOriginalFilename());

        // Upload to cloud storage
        String downloadUrl;
        try {
            downloadUrl = cloudStorageService.uploadFile(file, storageKey);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to upload file to cloud storage: " + e.getMessage());
        }

        // Save file metadata
        CloudFile cloudFile = new CloudFile();
        cloudFile.setOriginalFilename(file.getOriginalFilename());
        cloudFile.setStorageKey(storageKey);
        cloudFile.setStorageProvider(cloudStorageService.getStorageProvider());
        cloudFile.setFileSize(file.getSize());
        cloudFile.setMimeType(file.getContentType());
        cloudFile.setUploaderId(user.getId());
        cloudFile.setDownloadUrl(downloadUrl);
        cloudFile.setExpiresAt(LocalDateTime.now().plusDays(30)); // Files expire after 30 days

        return cloudFileRepository.save(cloudFile);
    }

    @Transactional(readOnly = true)
    public CloudFile getFileMetadata(Long fileId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        CloudFile cloudFile = cloudFileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        // Check if user owns the file
        if (!cloudFile.getUploaderId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        // Check if file is expired
        if (cloudFile.isExpired()) {
            throw new ResponseStatusException(HttpStatus.GONE, "File has expired");
        }

        return cloudFile;
    }

    @Transactional(readOnly = true)
    public List<CloudFile> getUserFiles(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return cloudFileRepository.findActiveFilesByUploader(user.getId());
    }

    @Transactional
    public void deleteFile(Long fileId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        CloudFile cloudFile = cloudFileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        // Check ownership
        if (!cloudFile.getUploaderId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        try {
            // Delete from cloud storage
            cloudStorageService.deleteFile(cloudFile.getStorageKey());
            
            // Mark as deleted in database
            cloudFileRepository.markAsDeletedByIdAndUploaderId(fileId, user.getId());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to delete file: " + e.getMessage());
        }
    }

    @Transactional
    public String getDownloadUrl(Long fileId, String username) {
        CloudFile cloudFile = getFileMetadata(fileId, username);
        
        // Generate a fresh download URL
        try {
            return cloudStorageService.generatePresignedUrl(
                cloudFile.getStorageKey(), 
                java.time.Duration.ofHours(1) // URL valid for 1 hour
            );
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to generate download URL: " + e.getMessage());
        }
    }

    private String generateStorageKey(String username, String originalFilename) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
        return String.format("%s/%s_%s_%s", username, timestamp, uuid, safeFilename);
    }

    @Transactional
    public int cleanupExpiredFiles() {
        return cloudFileRepository.deleteExpiredFiles(LocalDateTime.now());
    }
}