package com.smartcampus.dto.response;

import com.smartcampus.entity.Comment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for ticket comments provided as an API response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {

    private UUID id;
    private UUID ticketId;
    private String authorName;
    private UUID authorId;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Factory method to convert a {@link Comment} entity to a {@link CommentResponse}.
     */
    public static CommentResponse from(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .authorName(comment.getAuthor() != null ? comment.getAuthor().getName() : "Unknown")
                .authorId(comment.getAuthor() != null ? comment.getAuthor().getId() : null)
                .message(comment.getMessage())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
