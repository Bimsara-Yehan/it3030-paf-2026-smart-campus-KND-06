package com.smartcampus.dto.response;

import com.smartcampus.entity.TicketAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for ticket attachment metadata provided as an API response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {

    private UUID id;
    private UUID ticketId;
    private String fileName;
    private String fileUrl;
    private String mimeType;
    private Long fileSize;
    private LocalDateTime uploadedAt;

    /**
     * Factory method to convert a {@link TicketAttachment} entity to an {@link AttachmentResponse}.
     */
    public static AttachmentResponse from(TicketAttachment attachment) {
        return AttachmentResponse.builder()
                .id(attachment.getId())
                .ticketId(attachment.getTicket().getId())
                .fileName(attachment.getFileName())
                .fileUrl(attachment.getFileUrl())
                .mimeType(attachment.getMimeType())
                .fileSize(attachment.getFileSize())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }
}
