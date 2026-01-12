package com.cryptamail.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request payload for Google OAuth authentication.
 */
@Data
public class GoogleAuthRequest {
    
    @NotBlank(message = "Google access token is required")
    @Size(min = 10, message = "Invalid Google token")
    private String googleToken;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @Size(max = 255, message = "Name too long")
    private String name;

    @Size(max = 255, message = "Given name too long")
    private String givenName;

    @Size(max = 255, message = "Family name too long")
    private String familyName;

    @Size(max = 2048, message = "Image URL too long")
    private String imageUrl;
    
    /**
     * This should be the 'sub' claim from Google ID token
     */
    @NotBlank(message = "Google ID is required")
    private String googleId;
    
    /**
     * Optional: Public key from Google (if already exists)
     */
    private String publicKey;
    
    /**
     * Optional: Encrypted private key from Google (if already exists)
     */
    private String encryptedPrivateKey;
    
    /**
     * Optional: Date of birth for registration
     */
    private String dateOfBirth;
}