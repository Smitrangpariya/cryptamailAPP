package com.cryptamail.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    
    @Size(min = 3, max = 20, message = "Username must be 3-20 characters")
    private String newUsername;
    
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String newPassword;
    
    private String oldPassword;
    
    private RegisterRequest.EncryptedPrivateKey newEncryptedPrivateKey;
}
