package com.smartcampus.controller;

import com.smartcampus.dto.request.CreateResourceRequest;
import com.smartcampus.dto.request.UpdateResourceRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.ResourceAvailabilityResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;
    private final UUID SYSTEM_ADMIN_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceResponse>>> getAllResources() {
        List<ResourceResponse> data = resourceService.getAllResources();
        return ResponseEntity.ok(ApiResponse.success("Fetched all resources successfully", data));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ResourceResponse>>> search(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String naturalQuery) {
        
        log.info("Search requested. NaturalQuery: {}", naturalQuery);
        List<ResourceResponse> data;
        
        // Novelty AI Hook
        if (naturalQuery != null && !naturalQuery.trim().isEmpty()) {
            data = resourceService.smartSearch(naturalQuery);
        } else {
            data = resourceService.searchResources(type, minCapacity, location);
        }
        
        return ResponseEntity.ok(ApiResponse.success("Search completed successfully", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> getResourceById(@PathVariable UUID id) {
        ResourceResponse data = resourceService.getResourceById(id);
        return ResponseEntity.ok(ApiResponse.success("Resource fetched successfully", data));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<ResourceResponse>> createResource(@Valid @RequestBody CreateResourceRequest request) {
        ResourceResponse data = resourceService.createResource(request, SYSTEM_ADMIN_ID);
        return new ResponseEntity<>(ApiResponse.success("Resource created successfully", data), HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> updateResource(
            @PathVariable UUID id, 
            @Valid @RequestBody UpdateResourceRequest request) {
        ResourceResponse data = resourceService.updateResource(id, request);
        return ResponseEntity.ok(ApiResponse.success("Resource updated successfully", data));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable UUID id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.<Void>success("Resource archived successfully", null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ResourceResponse>> changeStatus(
            @PathVariable UUID id, 
            @RequestParam ResourceStatus status) {
        ResourceResponse data = resourceService.changeResourceStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Status updated successfully", data));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<List<ResourceAvailabilityResponse>>> getAvailability(@PathVariable UUID id) {
        List<ResourceAvailabilityResponse> data = resourceService.getResourceAvailability(id);
        return ResponseEntity.ok(ApiResponse.success("Availability fetched successfully", data));
    }
}
