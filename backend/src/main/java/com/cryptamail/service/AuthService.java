package com.cryptamail.service;

import com.cryptamail.dto.LoginRequest;
import com.cryptamail.dto.LoginResponse;
import com.cryptamail.dto.RegisterRequest;
import com.cryptamail.dto.GoogleAuthRequest;
import com.cryptamail.dto.GoogleUserInfo;
import com.cryptamail.model.User;
import com.cryptamail.repository.UserRepository;
import com.cryptamail.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    /**
     * Register a new user with encrypted private key
     */
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        // Normalize username to lowercase
        String username = request.getUsername().toLowerCase().trim();
        
        // Check if username already exists
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        
        // Create new user
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPublicKey(request.getPublicKey());
        
        // Store encrypted private key
        var epk = request.getEncryptedPrivateKey();
        user.setEncryptedPrivateKeyCiphertext(epk.getEncrypted());
        user.setEncryptedPrivateKeyIv(epk.getIv());
        user.setEncryptedPrivateKeySalt(epk.getSalt());
        user.setKdfIterations(epk.getIterations() != null ? epk.getIterations() : 200000);
        
        user = userRepository.save(user);
        
        // Generate JWT token
        String token = jwtUtil.generateToken(username);
        
        // Build response
        return buildLoginResponse(user, token);
    }
    
    /**
     * Login existing user
     */
    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername().toLowerCase().trim();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }
        
        // Generate JWT token
        String token = jwtUtil.generateToken(username);
        
        return buildLoginResponse(user, token);
    }
    
    /**
     * Update User Profile
     */
    @Transactional
    public LoginResponse updateProfile(String currentUsername, com.cryptamail.dto.UpdateProfileRequest request) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid old password");
        }

        // Update Username
        if (request.getNewUsername() != null && !request.getNewUsername().isEmpty()) {
            String newUsername = request.getNewUsername().toLowerCase().trim();
            if (!newUsername.equals(user.getUsername())) {
                if (userRepository.findByUsername(newUsername).isPresent()) {
                    throw new RuntimeException("Username already taken");
                }
                user.setUsername(newUsername);
            }
        }

        // Update Password & Encrypted Private Key
        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            
            // If password changes, we MUST have the re-encrypted private key
            if (request.getNewEncryptedPrivateKey() == null) {
                throw new RuntimeException("Re-encrypted private key required when changing password");
            }
            
            var epk = request.getNewEncryptedPrivateKey();
            user.setEncryptedPrivateKeyCiphertext(epk.getEncrypted()); // Assuming UpdateProfileRequest was also using RegisterRequest.EncryptedPrivateKey or has 'ciphertext' field
            user.setEncryptedPrivateKeyIv(epk.getIv());
            user.setEncryptedPrivateKeySalt(epk.getSalt());
            user.setKdfIterations(epk.getIterations() != null ? epk.getIterations() : 200000);
        }

        user = userRepository.save(user);
        
        // Generate new token (username might have changed)
        String token = jwtUtil.generateToken(user.getUsername());
        
        return buildLoginResponse(user, token);
    }

    /**
     * Build login response with user data
     */
    private LoginResponse buildLoginResponse(User user, String token) {
        LoginResponse.EncryptedPrivateKey epk = new LoginResponse.EncryptedPrivateKey(
                user.getEncryptedPrivateKeyCiphertext(),
                user.getEncryptedPrivateKeyIv(),
                user.getEncryptedPrivateKeySalt(),
                user.getKdfIterations()
        );
        
        return new LoginResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getAddress(),
                user.getPublicKey(),
                epk
        );
    }

    /**
     * Google OAuth authentication
     */
    @Transactional
    public LoginResponse googleLogin(GoogleAuthRequest request) {
        try {
            // Verify Google token
            GoogleUserInfo googleUser = verifyGoogleToken(request.getGoogleToken());
            
            // Check if user exists by Google ID (use verified info)
            User existingUser = userRepository.findByGoogleId(googleUser.getId()).orElse(null);

            if (existingUser != null) {
                // User exists - login and generate JWT
                String token = jwtUtil.generateToken(existingUser.getUsername());
                return LoginResponse.builder()
                    .userId(existingUser.getId())
                    .token(token)
                    .address(existingUser.getUsername() + "@smail.in")
                    .build();
            }

            // New user - register; derive identity from verified Google info
            String email = googleUser.getEmail();
            if (email == null || email.isBlank()) {
                throw new RuntimeException("Google account email not available");
            }
            String username = email.split("@")[0].toLowerCase().trim();
            if (userRepository.findByUsername(username).isPresent()) {
                throw new RuntimeException("Username already exists. Please choose a different username.");
            }

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setName(googleUser.getName());
            user.setGoogleId(googleUser.getId());
            user.setGoogleUser(true);
            // Public key and encrypted private key must be provided by the client for end-to-end encryption
            user.setPublicKey(request.getPublicKey());
            // For Google auth, encryptedPrivateKey is provided as a string (JSON)
            // In a real implementation, this would be parsed from a JSON string
            // For now, we'll skip private key storage for Google auth
            user.setEncryptedPrivateKeyCiphertext("");
            user.setEncryptedPrivateKeyIv("");
            user.setEncryptedPrivateKeySalt("");
            user.setKdfIterations(200000);

            User savedUser = userRepository.save(user);
            String token = jwtUtil.generateToken(savedUser.getUsername());

            return LoginResponse.builder()
                .userId(savedUser.getId())
                .token(token)
                .address(savedUser.getUsername() + "@smail.in")
                .build();
                
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Verify Google OAuth token and get user info
     */
    public GoogleUserInfo verifyGoogleToken(String token) {
        String url = "https://www.googleapis.com/oauth2/v2/userinfo";
        
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<GoogleUserInfo> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, GoogleUserInfo.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to verify Google token");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error verifying Google token: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get Google user info for frontend verification
     */
    public GoogleUserInfo getGoogleUserInfo(String accessToken) {
        String url = "https://www.googleapis.com/oauth2/v2/userinfo";
        
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<GoogleUserInfo> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, GoogleUserInfo.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to get Google user info");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error getting Google user info: " + e.getMessage(), e);
        }
    }
}
