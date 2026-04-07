package com.smartcampus.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponse {

    private UUID id;
    private String name;
    private String type;
    private Integer capacity;
    private String location;
    private String description;
    private String status;
    private UUID createdById;
    private List<ResourceAvailabilityResponse> availabilities;
}
