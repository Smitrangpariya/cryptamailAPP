package com.cryptamail.dto;

import com.cryptamail.model.CloudFile;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper=false)
public class EmailDtoWithCloudFiles extends EmailDto {
    private List<CloudFileDto> cloudFiles;

    @Data
    public static class CloudFileDto {
        private Long id;
        private String originalFilename;
        private Long fileSize;
        private String mimeType;
        private String downloadUrl;
        private String expiresAt;

        public CloudFileDto(CloudFile cloudFile) {
            this.id = cloudFile.getId();
            this.originalFilename = cloudFile.getOriginalFilename();
            this.fileSize = cloudFile.getFileSize();
            this.mimeType = cloudFile.getMimeType();
            this.downloadUrl = cloudFile.getDownloadUrl();
            this.expiresAt = cloudFile.getExpiresAt() != null ? cloudFile.getExpiresAt().toString() : null;
        }
    }
}