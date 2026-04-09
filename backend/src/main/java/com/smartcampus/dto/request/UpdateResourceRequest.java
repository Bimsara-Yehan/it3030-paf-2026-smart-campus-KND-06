package com.smartcampus.dto.request;

import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateResourceRequest {

    private String name;

    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private String location;

    private String description;

    private ResourceStatus status;
}
