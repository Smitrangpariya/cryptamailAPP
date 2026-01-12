package com.cryptamail.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attachment_chunks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Attachment attachment;

    @Column(nullable = false)
    private Integer chunkIndex;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB") // Ensure ample space for 5MB+ chunks (MySQL limit: 4GB)
    private byte[] encryptedData;

    @Column(nullable = false)
    private String iv;

    @Column(nullable = false)
    private Long size;
}
