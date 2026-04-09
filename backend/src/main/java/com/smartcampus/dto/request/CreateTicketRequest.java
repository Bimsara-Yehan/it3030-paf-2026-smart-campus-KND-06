package com.smartcampus.dto.request;

import com.smartcampus.enums.TicketCategory;
import com.smartcampus.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Data Transfer Object for creating a new maintenance ticket.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {

    /** Brief title/subject of the incident. */
    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    /** Detailed description of the problem. */
    @NotBlank(message = "Description is required")
    private String description;

    /** Priority level of the ticket. */
    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    /** The category of the incident. */
    @NotNull(message = "Category is required")
    private TicketCategory category;

    /** Optional preferred contact method or details. */
    @Size(max = 255, message = "Contact details must not exceed 255 characters")
    private String preferredContact;

    /** Optional ID of the affected campus resource. */
    private UUID resourceId;
}
