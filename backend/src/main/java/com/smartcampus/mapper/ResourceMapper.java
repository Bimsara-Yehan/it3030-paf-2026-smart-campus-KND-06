package com.smartcampus.mapper;

import com.smartcampus.dto.request.CreateResourceRequest;
import com.smartcampus.dto.response.ResourceAvailabilityResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.ResourceAvailability;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ResourceMapper {

    public Resource toEntity(CreateResourceRequest dto) {
        if (dto == null) {
            return null;
        }

        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setDescription(dto.getDescription());
        return resource;
    }

    public ResourceResponse toDto(Resource entity) {
        if (entity == null) {
            return null;
        }

        List<ResourceAvailabilityResponse> availabilityResponses = Collections.emptyList();
        if (entity.getAvailabilities() != null) {
            availabilityResponses = entity.getAvailabilities().stream()
                    .map(this::toAvailabilityDto)
                    .collect(Collectors.toList());
        }

        return ResourceResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .type(entity.getType())
                .capacity(entity.getCapacity())
                .location(entity.getLocation())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .createdById(entity.getCreatedBy() != null ? entity.getCreatedBy().getId() : null)
                .availabilities(availabilityResponses)
                .build();
    }

    public ResourceAvailabilityResponse toAvailabilityDto(ResourceAvailability entity) {
        if (entity == null) {
            return null;
        }

        return ResourceAvailabilityResponse.builder()
                .id(entity.getId())
                .dayOfWeek(entity.getDayOfWeek())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .build();
    }
}
