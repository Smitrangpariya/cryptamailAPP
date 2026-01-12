package com.cryptamail.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String publicKey;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String encryptedPrivateKeyCiphertext;

@Column(nullable = false, length = 512)
    private String encryptedPrivateKeyIv;

    @Column(nullable = false, length = 512)
    private String encryptedPrivateKeySalt;

    @Column(nullable = false)
    private Integer kdfIterations;

    private Long storageQuota = 10737418240L; // 10GB default
    private Long storageUsed = 0L;
    
    // Additional fields for Google OAuth
    @Column(unique = true)
    private String email;
    
    @Column
    private String password;
    
    @ElementCollection
    private List<String> roles;
    
    @OneToMany(mappedBy = "uploader", cascade = CascadeType.ALL)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Attachment> attachments;
    
    // Google OAuth fields
    @Column
    private String googleId;
    
    @Column
    private String name;
    
    @Column
    private boolean googleUser = false;

    // Manual Getters to fix "Cannot find symbol"
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getPublicKey() { return publicKey; }
    public Long getStorageUsed() { return storageUsed; }
    public Long getStorageQuota() { return storageQuota; }
    public String getEncryptedPrivateKeyCiphertext() { return encryptedPrivateKeyCiphertext; }
    public String getEncryptedPrivateKeyIv() { return encryptedPrivateKeyIv; }
    public String getEncryptedPrivateKeySalt() { return encryptedPrivateKeySalt; }
    public Integer getKdfIterations() { return kdfIterations; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public List<String> getRoles() { return roles; }

// Manual Setters
    public void setUsername(String username) { this.username = username; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setStorageUsed(Long storageUsed) { this.storageUsed = storageUsed; }
    public void setKdfIterations(Integer kdfIterations) { this.kdfIterations = kdfIterations; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public void setUserName(String userName) { this.username = userName; }
    
    // Missing setters for encrypted private key fields
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
    public void setEncryptedPrivateKeyCiphertext(String encryptedPrivateKeyCiphertext) { this.encryptedPrivateKeyCiphertext = encryptedPrivateKeyCiphertext; }
    public void setEncryptedPrivateKeyIv(String encryptedPrivateKeyIv) { this.encryptedPrivateKeyIv = encryptedPrivateKeyIv; }
    public void setEncryptedPrivateKeySalt(String encryptedPrivateKeySalt) { this.encryptedPrivateKeySalt = encryptedPrivateKeySalt; }
    public String getGoogleId() { return googleId; }
    public String getName() { return name; }
    public boolean isGoogleUser() { return googleUser; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    public void setName(String name) { this.name = name; }
    public void setGoogleUser(boolean googleUser) { this.googleUser = googleUser; }
    
    // getAddress method for compilation compatibility
    public String getAddress() {
        return username + "@smail.in";
    }
}