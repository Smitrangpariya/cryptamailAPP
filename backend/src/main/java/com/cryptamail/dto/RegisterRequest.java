package com.cryptamail.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 20, message = "Username must be 3-20 characters")
    @Pattern(regexp = "^[a-zA-Z0-9]([a-zA-Z0-9._]{1,18}[a-zA-Z0-9])?$",
             message = "Username can only contain letters, numbers, dots, and underscores")
    private String username;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be 8-128 characters")
    private String password;
    
    @NotBlank(message = "Public key is required")
    private String publicKey;
    
    @NotNull(message = "Encrypted private key is required")
    @jakarta.validation.Valid // Ensure nested validation
    private EncryptedPrivateKey encryptedPrivateKey;
    
    private String dateOfBirth;

    @Data
    public static class EncryptedPrivateKey {
        @NotBlank(message = "Encrypted content is required")
        private String encrypted;
        
        @NotBlank(message = "IV is required")
        private String iv;
        
        @NotBlank(message = "Salt is required")
        private String salt;
        
        private Integer iterations = 200000;
    }
}
