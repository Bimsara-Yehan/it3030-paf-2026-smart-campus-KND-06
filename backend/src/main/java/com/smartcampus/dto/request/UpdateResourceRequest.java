package com.smartcampus.dto.request;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateResourceRequest {

    private String name;

    private String type;

    @Positive(message = "Capacity must be a positive number if provided")
    private Integer capacity;

    private String location;

    private String description;

    private String status; // Allows updating status to OUT_OF_SERVICE
}
