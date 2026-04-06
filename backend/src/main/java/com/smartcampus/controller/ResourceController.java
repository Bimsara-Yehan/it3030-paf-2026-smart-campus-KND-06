package com.smartcampus.controller;

import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.entity.Resource;
import com.smartcampus.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller for Resource entities.
 */
@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceRepository resourceRepository;

    /**
     * GET /resources — List all resources.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Resource>>> getAllResources() {
        List<Resource> resources = resourceRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Resources retrieved.", resources));
    }
}
