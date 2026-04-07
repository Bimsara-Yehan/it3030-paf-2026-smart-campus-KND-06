package com.smartcampus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateResourceRequest {

    @NotBlank(message = "Resource name is required")
    private String name;

    @NotBlank(message = "Resource type is required (e.g., LECTURE_HALL, EQUIPMENT)")
    private String type;

    @Positive(message = "Capacity must be a positive number if provided")
    private Integer capacity;

    private String location;

    private String description;
}
