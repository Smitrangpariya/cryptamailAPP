package com.cryptamail.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InitAttachmentRequest {
    // Optional: plain filename for legacy support, encrypted filename preferred
    @Size(max = 255, message = "Filename cannot exceed 255 characters")
    private String filename;

    @NotNull(message = "MIME type is required")
    @Size(max = 100, message = "MIME type is too long")
    private String mimeType;

    @NotNull(message = "Total size is required")
    @Positive(message = "Total size must be positive")
    @Max(value = 1073741824L, message = "File size cannot exceed 1GB")
    private Long totalSize;
    
    @NotNull(message = "Total chunks is required")
    @Positive(message = "Total chunks must be positive")
    private Integer totalChunks;
    
    // Encrypted metadata fields (preferred)
    private String encryptedFilename;
    private String filenameIv;
    private String encryptedKeySender;
    private String encryptedKeyRecipient;
}
