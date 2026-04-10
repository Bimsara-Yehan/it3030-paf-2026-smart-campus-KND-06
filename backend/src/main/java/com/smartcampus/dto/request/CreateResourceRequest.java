package com.smartcampus.dto.request;

import com.smartcampus.enums.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateResourceRequest {

    @NotBlank(message = "Resource name is strictly required")
    private String name;

    @NotNull(message = "Resource type is strictly required")
    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private String location;

    private String description;
}
