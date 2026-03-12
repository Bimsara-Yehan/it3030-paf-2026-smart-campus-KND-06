package com.smartcampus.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for adding a new comment to a ticket.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddCommentRequest {

    /** The content of the comment. */
    @NotBlank(message = "Comment content cannot be empty")
    private String content;
}
