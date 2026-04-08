package com.smartcampus.dto.response;

import com.smartcampus.entity.Booking;
import com.smartcampus.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only DTO representing a booking in API responses.
 * 
 * <p>Member 2: Managed entity representation.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private UUID id;
    private UserResponse user;
    private ResourceResponse resource;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BookingStatus status;
    private String notes;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Static factory to convert Entity to DTO safely.
     */
    public static BookingResponse from(Booking booking) {
        if (booking == null) return null;

        return BookingResponse.builder()
                .id(booking.getId())
                .user(UserResponse.from(booking.getUser()))
                .resource(ResourceResponse.builder()
                        .id(booking.getResource().getId())
                        .name(booking.getResource().getName())
                        .type(booking.getResource().getType().name())
                        .build())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(booking.getStatus())
                .notes(booking.getPurpose())
                .rejectionReason(booking.getRejectionReason())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceResponse {
        private UUID id;
        private String name;
        private String type;
    }
}
