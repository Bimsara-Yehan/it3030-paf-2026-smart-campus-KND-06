package com.smartcampus.dto.response;

import com.smartcampus.entity.Ticket;
import com.smartcampus.enums.TicketCategory;
import com.smartcampus.enums.TicketPriority;
import com.smartcampus.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for ticket details provided as an API response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private UUID id;
    private String reporterName;
    private UUID reporterId;
    private UUID resourceId;
    private TicketCategory category;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private String preferredContact;
    private String assignedTechnicianName;
    private UUID assignedTechnicianId;
    private LocalDateTime assignedAt;
    private String resolutionNotes;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Factory method to convert a {@link Ticket} entity to a {@link TicketResponse}.
     *
     * @param ticket the ticket entity to convert
     * @return a mapped TicketResponse
     */
    public static TicketResponse from(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .reporterName(ticket.getReporter() != null ? ticket.getReporter().getName() : null)
                .reporterId(ticket.getReporter() != null ? ticket.getReporter().getId() : null)
                .resourceId(ticket.getResourceId())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .preferredContact(ticket.getPreferredContact())
                .assignedTechnicianName(ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getName() : null)
                .assignedTechnicianId(ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getId() : null)
                .assignedAt(ticket.getAssignedAt())
                .resolutionNotes(ticket.getResolutionNotes())
                .resolvedAt(ticket.getResolvedAt())
                .closedAt(ticket.getClosedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
