package com.smartcampus.dto.response;

import com.smartcampus.entity.ResourceAvailability;
import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class ResourceAvailabilityResponse {
    private UUID id;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;

    // PR Checklist Requirement: Static factory method
    public static ResourceAvailabilityResponse from(ResourceAvailability availability) {
        if (availability == null) return null;
        
        return ResourceAvailabilityResponse.builder()
                .id(availability.getId())
                .dayOfWeek(availability.getDayOfWeek())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .build();
    }
}
