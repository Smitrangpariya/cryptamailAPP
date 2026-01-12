package com.cryptamail.controller;

import com.cryptamail.dto.PublicKeyResponse;
import com.cryptamail.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    /**
     * Get user's public key by username or address
     * GET /api/users/public-key?username=alice
     * GET /api/users/public-key?address=alice@smail.in
     */
    @GetMapping("/public-key")
    public ResponseEntity<PublicKeyResponse> getPublicKey(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String address) {
        
        try {
            PublicKeyResponse response;
            
            if (username != null) {
                response = userService.getPublicKeyByUsername(username);
            } else if (address != null) {
                response = userService.getPublicKeyByAddress(address);
            } else {
                return ResponseEntity.badRequest().build();
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Autowired
    private com.cryptamail.service.AuthService authService;
    
    /**
     * Search users
     * GET /api/users/search?query=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<java.util.List<String>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }

    /**
     * Update Profile
     * PUT /api/users/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody com.cryptamail.dto.UpdateProfileRequest request,
            org.springframework.security.core.Authentication authentication) {
        try {
            String username = authentication.getName();
            com.cryptamail.dto.LoginResponse response = authService.updateProfile(username, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    /**
     * Get user storage usage
     * GET /api/users/storage
     */
    @GetMapping("/storage")
    public ResponseEntity<?> getStorageUsage(
            org.springframework.security.core.Authentication authentication) {
        try {
            String username = authentication.getName();
            var storageInfo = userService.getStorageUsage(username);
            return ResponseEntity.ok(storageInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    /**
     * Delete user account
     * DELETE /api/users/account
     */
    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(
            @RequestBody com.cryptamail.dto.DeleteAccountRequest request,
            org.springframework.security.core.Authentication authentication) {
        try {
            String username = authentication.getName();
            userService.deleteAccount(username, request.getPassword());
            return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Account deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }
}
