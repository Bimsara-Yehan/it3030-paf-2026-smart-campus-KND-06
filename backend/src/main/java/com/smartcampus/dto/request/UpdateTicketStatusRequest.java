package com.smartcampus.dto.request;

import com.smartcampus.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for updating the status of a ticket.
 * Primarily used by technicians.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTicketStatusRequest {

    /** The new status to transition the ticket to. */
    @NotNull(message = "Status is required")
    private TicketStatus status;

    /** Optional notes describing the work done or reason for the status change. */
    private String notes;
}
