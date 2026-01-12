package com.cryptamail.dto;

import lombok.Data;

@Data
public class StorageUsageResponse {
    private Long storageUsed;
    private Long storageQuota;
    private Double usagePercentage;
    private String storageUsedFormatted;
    private String storageQuotaFormatted;

    public StorageUsageResponse(Long storageUsed, Long storageQuota) {
        this.storageUsed = storageUsed;
        this.storageQuota = storageQuota;
        this.usagePercentage = storageQuota > 0 ? (storageUsed * 100.0 / storageQuota) : 0.0;
        this.storageUsedFormatted = formatBytes(storageUsed);
        this.storageQuotaFormatted = formatBytes(storageQuota);
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }
}