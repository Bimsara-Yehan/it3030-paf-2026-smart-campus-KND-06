package com.smartcampus.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAvailabilityResponse {

    private UUID id;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
}
