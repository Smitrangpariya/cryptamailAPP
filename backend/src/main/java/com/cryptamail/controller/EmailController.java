package com.cryptamail.controller;

import com.cryptamail.dto.DeletedCountResponse;
import com.cryptamail.dto.EmailDto;
import com.cryptamail.dto.SendEmailRequest;
import com.cryptamail.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emails")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * ✅ GET INBOX
     * Identity is taken ONLY from JWT (Authentication)
     * NO username from frontend
     */
    @GetMapping("/inbox")
    public ResponseEntity<List<EmailDto>> getInbox(Authentication authentication) {
        String username = authentication.getName();
        List<EmailDto> inbox = emailService.getInbox(username);
        return ResponseEntity.ok(inbox);
    }

    /**
     * ✅ GET SENT
     */
    @GetMapping("/sent")
    public ResponseEntity<List<EmailDto>> getSent(Authentication authentication) {
        String username = authentication.getName();
        List<EmailDto> sent = emailService.getSent(username);
        return ResponseEntity.ok(sent);
    }

    /**
     * ✅ GET TRASH
     */
    @GetMapping("/trash")
    public ResponseEntity<List<EmailDto>> getTrash(Authentication authentication) {
        String username = authentication.getName();
        List<EmailDto> trash = emailService.getTrash(username);
        return ResponseEntity.ok(trash);
    }

    /**
     * ✅ SEND EMAIL
     */
    @PostMapping("/send")
    public ResponseEntity<?> 
    sendEmail(
            @Valid @RequestBody SendEmailRequest request,
            Authentication authentication
    ) {
        String senderUsername = authentication.getName();
        emailService.sendEmail(request, senderUsername);
        return ResponseEntity.ok().build();
    }

    /**
     * ✅ MARK AS READ
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            Authentication authentication
    ) {
        emailService.markAsRead(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

/**
     * DELETE EMAIL (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmail(
            @PathVariable Long id,
            Authentication authentication
    ) {
        emailService.deleteEmail(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * PERMANENTLY DELETE EMAIL
     */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> permanentlyDeleteEmail(
            @PathVariable Long id,
            Authentication authentication
    ) {
        emailService.permanentlyDeleteEmail(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * EMPTY TRASH (permanently delete all trash emails)
     */
    @DeleteMapping("/trash/empty")
    public ResponseEntity<?> emptyTrash(Authentication authentication) {
        int deletedCount = emailService.emptyTrash(authentication.getName());
        return ResponseEntity.ok(new DeletedCountResponse(deletedCount));
    }

    /**
     * ✅ GET SPAM
     */
    @GetMapping("/spam")
    public ResponseEntity<List<EmailDto>> getSpam(Authentication authentication) {
        String username = authentication.getName();
        List<EmailDto> spam = emailService.getSpam(username);
        return ResponseEntity.ok(spam);
    }

    /**
     * ✅ MARK AS SPAM
     */
    @PatchMapping("/{id}/spam")
    public ResponseEntity<?> markAsSpam(
            @PathVariable Long id,
            Authentication authentication
    ) {
        emailService.markSpam(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * ✅ MARK AS NOT SPAM
     */
    @PatchMapping("/{id}/not-spam")
    public ResponseEntity<?> markAsNotSpam(
            @PathVariable Long id,
            Authentication authentication
    ) {
        emailService.markNotSpam(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * ✅ RESTORE EMAIL
     */
    @PatchMapping("/{id}/restore")
    public ResponseEntity<?> restoreEmail(
            @PathVariable Long id,
            Authentication authentication
    ) {
        emailService.restoreEmail(id, authentication.getName());
        return ResponseEntity.ok().build();
    }
}
