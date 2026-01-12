package com.cryptamail.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
public class AttachmentStatusResponse {
    private String status;
    private Integer totalChunks;
    private List<Integer> uploadedChunks;
}
