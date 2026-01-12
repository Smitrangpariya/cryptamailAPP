package com.cryptamail;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot application class for CryptaMail.
 * 
 * CryptaMail is an end-to-end encrypted email application.
 * All email content is encrypted on the client before being sent to the server.
 */
@SpringBootApplication
public class CryptaMailApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(CryptaMailApplication.class, args);
    }
}
