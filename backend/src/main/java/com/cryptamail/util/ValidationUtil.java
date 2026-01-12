package com.cryptamail.util;

import org.springframework.stereotype.Component;
import java.util.regex.Pattern;

/**
 * Utility class for input validation and sanitization
 */
@Component
public class ValidationUtil {

    // Email regex pattern (RFC 5322 simplified)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    // Username pattern: alphanumeric, dash, underscore, 3-32 characters
    private static final Pattern USERNAME_PATTERN = Pattern.compile(
        "^[A-Za-z0-9_-]{3,32}$"
    );

    // Base64 pattern
    private static final Pattern BASE64_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+/]*={0,2}$"
    );

    /**
     * Validate email format
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        if (email.length() > 254) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * Validate username format
     */
    public boolean isValidUsername(String username) {
        if (username == null || username.isBlank()) {
            return false;
        }
        return USERNAME_PATTERN.matcher(username).matches();
    }

    /**
     * Validate password strength
     * - Minimum 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one digit
     * - At least one special character
     */
    public boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        if (password.length() > 128) {
            return false;
        }
        // At least one uppercase
        if (!password.matches(".*[A-Z].*")) {
            return false;
        }
        // At least one lowercase
        if (!password.matches(".*[a-z].*")) {
            return false;
        }
        // At least one digit
        if (!password.matches(".*\\d.*")) {
            return false;
        }
        // At least one special character
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>?].*")) {
            return false;
        }
        return true;
    }

    /**
     * Validate base64 encoded string
     */
    public boolean isValidBase64(String str) {
        if (str == null || str.isBlank() || str.length() % 4 != 0) {
            return false;
        }
        return BASE64_PATTERN.matcher(str).matches();
    }

    /**
     * Sanitize input string to prevent injection attacks
     */
    public String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }
        // Remove null bytes
        input = input.replace("\0", "");
        // Trim whitespace
        return input.trim();
    }

    /**
     * Validate JWT token format
     */
    public boolean isValidJWTFormat(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String[] parts = token.split("\\.");
        return parts.length == 3 && 
               !parts[0].isBlank() && 
               !parts[1].isBlank() && 
               !parts[2].isBlank();
    }

    /**
     * Validate file size (in bytes)
     */
    public boolean isValidFileSize(long fileSize, long maxSizeBytes) {
        return fileSize > 0 && fileSize <= maxSizeBytes;
    }
}
