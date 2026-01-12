package com.cryptamail.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.core.sync.RequestBody;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;

@Service
public class CloudStorageService {

    @Value("${cloud.storage.provider:local}")
    private String storageProvider;

    public String getStorageProvider() {
        return storageProvider;
    }

    @Value("${cloud.storage.s3.bucket:securemail-files}")
    private String s3Bucket;

    @Value("${cloud.storage.s3.region:us-east-1}")
    private String s3Region;

    @Value("${cloud.storage.s3.access-key:}")
    private String s3AccessKey;

    @Value("${cloud.storage.s3.secret-key:}")
    private String s3SecretKey;

    @Value("${cloud.storage.s3.endpoint:}")
    private String s3Endpoint;

    private S3Client s3Client;

    public String uploadFile(MultipartFile file, String fileName) throws IOException {
        if ("s3".equalsIgnoreCase(storageProvider)) {
            return uploadToS3(file, fileName);
        } else {
            throw new UnsupportedOperationException("Storage provider not configured: " + storageProvider);
        }
    }

    public String generatePresignedUrl(String fileName, Duration expiration) {
        if ("s3".equalsIgnoreCase(storageProvider)) {
            return generateS3PresignedUrl(fileName, expiration);
        } else {
            throw new UnsupportedOperationException("Storage provider not configured: " + storageProvider);
        }
    }

    public void deleteFile(String fileName) {
        if ("s3".equalsIgnoreCase(storageProvider)) {
            deleteFromS3(fileName);
        }
    }

    private S3Client getS3Client() {
        if (s3Client == null) {
            var builder = S3Client.builder()
                    .region(Region.of(s3Region));

            if (!s3AccessKey.isEmpty() && !s3SecretKey.isEmpty()) {
                builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(s3AccessKey, s3SecretKey)
                ));
            }

            if (!s3Endpoint.isEmpty()) {
                builder.endpointOverride(URI.create(s3Endpoint));
            }

            s3Client = builder.build();
        }
        return s3Client;
    }

    private String uploadToS3(MultipartFile file, String fileName) throws IOException {
        S3Client client = getS3Client();
        
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(s3Bucket)
                .key(fileName)
                .contentType(file.getContentType())
                .build();

        client.putObject(request, RequestBody.fromBytes(file.getBytes()));
        
        return String.format("https://%s.s3.%s.amazonaws.com/%s", s3Bucket, s3Region, fileName);
    }

    private String generateS3PresignedUrl(String fileName, Duration expiration) {
        S3Client client = getS3Client();
        
        GetUrlRequest request = GetUrlRequest.builder()
                .bucket(s3Bucket)
                .key(fileName)
                .build();

        return client.utilities()
                .getUrl(request)
                .toExternalForm();
    }

    private void deleteFromS3(String fileName) {
        S3Client client = getS3Client();
        
        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(s3Bucket)
                .key(fileName)
                .build();

        client.deleteObject(request);
    }
}