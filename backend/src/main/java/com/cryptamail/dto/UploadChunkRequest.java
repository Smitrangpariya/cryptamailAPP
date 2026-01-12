package com.cryptamail.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UploadChunkRequest {
    @NotNull(message = "Chunk index is required")
    private Integer chunkIndex;

    @NotBlank(message = "Encrypted data is required")
    private String encryptedData; // Base64 encoded encrypted chunk

    @NotBlank(message = "IV is required")
    private String iv; // Base64 encoded IV for this chunk

    @NotNull(message = "Size is required")
    private Long size; // Size of this chunk in bytes
}
