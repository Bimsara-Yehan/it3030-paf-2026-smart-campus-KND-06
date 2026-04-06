package com.smartcampus.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Validated request DTO for creating a new booking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotNull(message = "Resource ID is required.")
    private UUID resourceId;

    @NotNull(message = "Start time is required.")
    @Future(message = "Start time must be in the future.")
    private LocalDateTime startTime;

    @Future(message = "End time must be in the future.")
    private LocalDateTime endTime;

    private Integer attendees;

    @NotNull(message = "Purpose is required.")
    private String purpose;
}
