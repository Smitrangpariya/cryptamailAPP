package com.cryptamail.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long userId;
    private String username;
    private String address;  // username@smail.in
    private String publicKey;
    private EncryptedPrivateKey encryptedPrivateKey;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EncryptedPrivateKey {
        private String ciphertext;
        private String iv;
        private String salt;
        private Integer iterations;
    }
}
