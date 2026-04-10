package com.smartcampus.dto.response;

import com.smartcampus.entity.Resource;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class ResourceResponse {
    private UUID id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String description;
    private ResourceStatus status;
    private UUID createdById;
    private List<ResourceAvailabilityResponse> availabilities;

    // PR Checklist Requirement: Static factory method
    public static ResourceResponse from(Resource resource) {
        if (resource == null) return null;

        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .description(resource.getDescription())
                .status(resource.getStatus())
                .createdById(resource.getCreatedBy() != null ? resource.getCreatedBy().getId() : null)
                .availabilities(resource.getAvailabilities() != null 
                    ? resource.getAvailabilities().stream()
                        .map(ResourceAvailabilityResponse::from)
                        .collect(Collectors.toList()) 
                    : null)
                .build();
    }
}
