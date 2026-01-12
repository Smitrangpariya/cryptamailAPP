package com.cryptamail.repository;

import com.cryptamail.model.AttachmentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttachmentChunkRepository extends JpaRepository<AttachmentChunk, Long> {
    List<AttachmentChunk> findByAttachmentIdOrderByChunkIndexAsc(Long attachmentId);
    Optional<AttachmentChunk> findByAttachmentIdAndChunkIndex(Long attachmentId, Integer chunkIndex);
    boolean existsByAttachmentIdAndChunkIndex(Long attachmentId, Integer chunkIndex);
    long countByAttachmentId(Long attachmentId);
    void deleteByAttachmentId(Long attachmentId);
    List<AttachmentChunk> findByAttachmentId(Long attachmentId);
}
