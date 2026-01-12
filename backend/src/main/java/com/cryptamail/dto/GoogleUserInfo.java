package com.cryptamail.dto;

import lombok.Data;

/**
 * Google user information response.
 */
@Data
public class GoogleUserInfo {
    
    private String id;
    private String email;
    private String name;
    private String given_name;
    private String family_name;
    private String picture;
    private boolean verified_email;
    private String locale;
}