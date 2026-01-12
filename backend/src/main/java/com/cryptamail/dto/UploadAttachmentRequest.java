package com.cryptamail.dto;

import lombok.Data;

@Data
public class UploadAttachmentRequest {
    private String encryptedFilename;
    private String filenameIv;
    private byte[] encryptedBlob;
    private String iv;
    private String encryptedKeySender;
    private String encryptedKeyRecipient;
    private String mimeType;
}
