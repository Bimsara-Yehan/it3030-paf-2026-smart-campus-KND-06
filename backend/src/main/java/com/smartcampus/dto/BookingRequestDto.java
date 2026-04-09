package com.smartcampus.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class BookingRequestDto {
    private UUID userId;
    private UUID resourceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String reason;
}
