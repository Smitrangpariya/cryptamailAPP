package com.cryptamail.repository;

import com.cryptamail.model.CloudFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CloudFileRepository extends JpaRepository<CloudFile, Long> {

    Optional<CloudFile> findByStorageKeyAndIsDeletedFalse(String storageKey);

    List<CloudFile> findByUploaderIdAndIsDeletedFalse(Long uploaderId);

    @Modifying
    @Transactional
    @Query("UPDATE CloudFile cf SET cf.isDeleted = true WHERE cf.id = ?1 AND cf.uploaderId = ?2")
    int markAsDeletedByIdAndUploaderId(Long fileId, Long uploaderId);

    @Modifying
    @Transactional
    @Query("DELETE FROM CloudFile cf WHERE cf.expiresAt IS NOT NULL AND cf.expiresAt < ?1")
    int deleteExpiredFiles(LocalDateTime before);

    @Query("SELECT cf FROM CloudFile cf WHERE cf.uploaderId = ?1 AND cf.isDeleted = false")
    List<CloudFile> findActiveFilesByUploader(Long uploaderId);
}