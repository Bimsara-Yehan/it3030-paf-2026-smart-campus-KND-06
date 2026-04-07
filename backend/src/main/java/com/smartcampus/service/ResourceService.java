package com.smartcampus.service;

import com.smartcampus.dto.request.CreateResourceRequest;
import com.smartcampus.dto.request.UpdateResourceRequest;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.User;
import com.smartcampus.mapper.ResourceMapper;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final ResourceMapper resourceMapper;

    @Transactional(readOnly = true)
    public List<ResourceResponse> searchResources(String type, Integer minCapacity, String location) {
        log.info("Searching resources - type: {}, minCapacity: {}, location: {}", type, minCapacity, location);
        List<Resource> resources = resourceRepository.searchResources(type, minCapacity, location);
        return resources.stream()
                .map(resourceMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(UUID id) {
        Resource resource = resourceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        return resourceMapper.toDto(resource);
    }

    @Transactional
    public ResourceResponse createResource(CreateResourceRequest request, UUID adminUserId) {
        log.info("Creating new resource: {}", request.getName());

        // Validate the user trying to create exists (Read-only as per Guideline 2)
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin User not found"));

        Resource newResource = resourceMapper.toEntity(request);
        newResource.setCreatedBy(adminUser);
        
        Resource savedResource = resourceRepository.save(newResource);
        return resourceMapper.toDto(savedResource);
    }

    @Transactional
    public ResourceResponse updateResource(UUID id, UpdateResourceRequest request) {
        log.info("Updating resource ID: {}", id);
        
        Resource existing = resourceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        if (request.getName() != null) existing.setName(request.getName());
        if (request.getType() != null) existing.setType(request.getType());
        if (request.getCapacity() != null) existing.setCapacity(request.getCapacity());
        if (request.getLocation() != null) existing.setLocation(request.getLocation());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getStatus() != null) existing.setStatus(request.getStatus());

        Resource updatedResource = resourceRepository.save(existing);
        return resourceMapper.toDto(updatedResource);
    }

    @Transactional
    public void deleteResource(UUID id) {
        log.info("Soft-deleting resource ID: {}", id);
        
        Resource existing = resourceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        // Soft Delete implementation
        existing.setDeletedAt(LocalDateTime.now());
        existing.setStatus("OUT_OF_SERVICE");
        
        resourceRepository.save(existing);
    }
}
