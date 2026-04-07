package com.smartcampus.controller;

import com.smartcampus.dto.request.CreateResourceRequest;
import com.smartcampus.dto.request.UpdateResourceRequest;
import com.smartcampus.dto.response.ResourceResponse;
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
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;

    // Hardcoded Admin ID for initial development/testing as per team security scaffolding
    // In actual production, this comes from the JWT Token of the logged-in user.
    private final UUID SYSTEM_ADMIN_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> searchResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        log.info("REST request to search resources");
        return ResponseEntity.ok(resourceService.searchResources(type, minCapacity, location));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable UUID id) {
        log.info("REST request to get resource: {}", id);
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PostMapping
    // @PreAuthorize("hasAnyRole('ADMIN')") // Uncomment when Member 4 finishes SecurityConfig matching
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody CreateResourceRequest request) {
        log.info("REST request to create resource: {}", request.getName());
        return new ResponseEntity<>(resourceService.createResource(request, SYSTEM_ADMIN_ID), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    // @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable UUID id, 
            @Valid @RequestBody UpdateResourceRequest request) {
        log.info("REST request to update resource: {}", id);
        return ResponseEntity.ok(resourceService.updateResource(id, request));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        log.info("REST request to delete resource: {}", id);
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
