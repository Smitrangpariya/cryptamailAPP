package com.cryptamail.controller;

import com.cryptamail.dto.LoginRequest;
import com.cryptamail.dto.LoginResponse;
import com.cryptamail.dto.RegisterRequest;
import com.cryptamail.dto.GoogleAuthRequest;
import com.cryptamail.dto.GoogleUserInfo;
import com.cryptamail.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication endpoints.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    /**
     * Register a new user.
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Login an existing user.
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Google OAuth login.
     * POST /api/auth/google
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        LoginResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get Google OAuth user info for frontend verification.
     * GET /api/auth/google/userinfo
     */
    @GetMapping("/google/userinfo")
    public ResponseEntity<?> getGoogleUserInfo(@RequestHeader("Authorization") String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization header is missing or invalid");
        }
        String accessToken = authorizationHeader.substring(7);
        GoogleUserInfo userInfo = authService.getGoogleUserInfo(accessToken);
        return ResponseEntity.ok(userInfo);
    }
}
