package com.smartcampus.dto.request;

import com.smartcampus.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Validated request DTO for updating booking status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBookingStatusRequest {

    @NotNull(message = "Status is required.")
    private BookingStatus status;

    private String reason;
}
