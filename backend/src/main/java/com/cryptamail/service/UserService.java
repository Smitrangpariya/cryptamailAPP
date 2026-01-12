package com.cryptamail.service;

import com.cryptamail.dto.PublicKeyResponse;
import com.cryptamail.dto.StorageUsageResponse;
import com.cryptamail.model.User;
import com.cryptamail.repository.UserRepository;
import com.cryptamail.repository.EmailRepository;
import com.cryptamail.repository.AttachmentRepository;
import com.cryptamail.repository.AttachmentChunkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    
    private static final String APP_EMAIL_DOMAIN = "smail.in";
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailRepository emailRepository;
    
    @Autowired
    private AttachmentRepository attachmentRepository;
    
    @Autowired
    private AttachmentChunkRepository attachmentChunkRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Get user's public key by username
     */
    public PublicKeyResponse getPublicKeyByUsername(String username) {
        final String normalizedUsername = username.toLowerCase().trim();
        
        User user = userRepository.findByUsername(normalizedUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + normalizedUsername));
        
        return new PublicKeyResponse(
                user.getUsername(),
                user.getAddress(),
                user.getPublicKey()
        );
    }
    
    /**
     * Get user's public key by @smail.in address
     */
    public PublicKeyResponse getPublicKeyByAddress(String address) {
        String username = parseEmailAddress(address);
        return getPublicKeyByUsername(username);
    }
    
    /**
     * Search users by username prefix
     */
    public java.util.List<String> searchUsers(String query) {
        if (query == null || query.trim().length() < 1) {
            return java.util.Collections.emptyList();
        }
        
        String prefix = query.toLowerCase().trim();
        java.util.List<User> users = userRepository.findByUsernameStartingWith(prefix);
        
        return users.stream()
                .map(User::getUsername)
                .limit(5)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Get storage usage for a user
     */
    public StorageUsageResponse getStorageUsage(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        
        // Calculate total storage used
        long totalStorageUsed = calculateStorageUsed(user.getId());
        
        // Update user's storage used field
        user.setStorageUsed(totalStorageUsed);
        userRepository.save(user);
        
        return new StorageUsageResponse(totalStorageUsed, user.getStorageQuota());
    }
    
    /**
     * Calculate total storage used by a user
     */
    private long calculateStorageUsed(Long userId) {
        long totalSize = 0;
        
        // Calculate email sizes (subject + body + keys + IVs)
        var emails = emailRepository.findAllBySenderIdOrRecipientId(userId, userId);
        for (var email : emails) {
            if (email != null) {
                int emailSize = 0;
                if (email.getEncryptedSubject() != null) {
                    emailSize += email.getEncryptedSubject().length();
                }
                if (email.getSubjectIv() != null) {
                    emailSize += email.getSubjectIv().length();
                }
                if (email.getEncryptedBody() != null) {
                    emailSize += email.getEncryptedBody().length();
                }
                if (email.getBodyIv() != null) {
                    emailSize += email.getBodyIv().length();
                }
                if (email.getEncryptedSymmetricKey() != null) {
                    emailSize += email.getEncryptedSymmetricKey().length();
                }
                if (email.getSenderEncryptedSymmetricKey() != null) {
                    emailSize += email.getSenderEncryptedSymmetricKey().length();
                }
                totalSize += emailSize;
            }
        }
        
        // Calculate attachment sizes (only attachments uploaded by this user)
        var attachments = attachmentRepository.findByUploaderId(userId);
        for (var attachment : attachments) {
            if (attachment != null && attachment.getTotalSize() != null) {
                totalSize += attachment.getTotalSize();
            }
        }
        
        return totalSize;
    }
    
    /**
     * Delete user account and all associated data
     */
    @Transactional
    public void deleteAccount(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        
        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }
        
        // Delete emails where user is sender or recipient
        var emails = emailRepository.findAllBySenderIdOrRecipientId(user.getId(), user.getId());
        emailRepository.deleteAll(emails);
        
        // Delete attachments uploaded by user
        var attachments = attachmentRepository.findByUploaderId(user.getId());
        for (var attachment : attachments) {
            if (attachment != null) {
                // Delete attachment chunks first
                var chunks = attachmentChunkRepository.findByAttachmentId(attachment.getId());
                attachmentChunkRepository.deleteAll(chunks);
            }
        }
        attachmentRepository.deleteAll(attachments);
        
        // Finally, delete the user
        userRepository.delete(user);
    }

    /**
     * Parse @smail.in address to extract username
     */
    private String parseEmailAddress(String address) {
        if (address == null || !address.contains("@")) {
            throw new RuntimeException("Invalid email address format");
        }
        
        String[] parts = address.split("@");
        if (parts.length != 2) {
            throw new RuntimeException("Invalid email address format");
        }
        
        String username = parts[0];
        String domain = parts[1];
        
        if (!domain.equalsIgnoreCase(APP_EMAIL_DOMAIN)) {
            throw new RuntimeException(
                    "Invalid domain. Only @" + APP_EMAIL_DOMAIN + " addresses are supported."
            );
        }
        
        return username.toLowerCase().trim();
    }
}
