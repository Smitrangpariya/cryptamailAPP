package com.cryptamail.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.*;
import lombok.Data;

@Data
public class SendEmailRequest {

    @NotBlank(message = "Recipient username is required")
    @Size(min = 1, max = 100, message = "Recipient username must be 1-100 characters")
    private String toUsername;

    @NotBlank(message = "Encrypted subject is required")
    @Size(max = 10000, message = "Encrypted subject too large")
    private String encryptedSubject;

    @NotBlank(message = "Subject IV is required")
    private String subjectIv;

    @NotBlank(message = "Encrypted body is required")
    @Size(max = 1000000, message = "Encrypted body too large (max 1MB)")
    private String encryptedBody;

    @NotBlank(message = "Body IV is required")
    private String bodyIv;

    @NotBlank(message = "Encrypted symmetric key is required")
    private String encryptedSymmetricKey;

    @NotBlank(message = "Sender encrypted symmetric key is required")
    private String senderEncryptedSymmetricKey;

    private List<Long> attachmentIds;
    private List<Long> cloudFileIds;
}
