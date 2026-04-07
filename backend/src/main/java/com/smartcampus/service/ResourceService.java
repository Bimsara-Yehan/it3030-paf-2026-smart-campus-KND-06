package com.smartcampus.service;

import com.smartcampus.dto.request.CreateResourceRequest;
import com.smartcampus.dto.request.UpdateResourceRequest;
import com.smartcampus.dto.response.ResourceAvailabilityResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.User;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
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

    @Transactional(readOnly = true)
    public List<ResourceResponse> getAllResources() {
        return resourceRepository.findByDeletedAtIsNull().stream()
                .map(ResourceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> searchResources(String typeStr, Integer minCapacity, String location) {
        ResourceType type = null;
        if (typeStr != null && !typeStr.isEmpty()) {
            try { type = ResourceType.valueOf(typeStr.toUpperCase()); } catch (Exception ignored) {}
        }
        
        List<Resource> resources = resourceRepository.searchResources(
                type != null ? type.name() : null, 
                minCapacity, 
                location
        );
        return resources.stream().map(ResourceResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> smartSearch(String naturalQuery) {
        log.info("Executing AI Smart Search for query: {}", naturalQuery);
        String q = naturalQuery.toLowerCase();
        
        // --- The Smart Search Lexical Parser ---
        ResourceType detectedType = null;
        if (q.contains("lab")) detectedType = ResourceType.LAB;
        else if (q.contains("hall") || q.contains("theatre")) detectedType = ResourceType.ROOM; // Mapped ROOM since LECTURE_HALL was genericized
        else if (q.contains("equipment") || q.contains("projector")) detectedType = ResourceType.EQUIPMENT;
        else if (q.contains("vehicle") || q.contains("van")) detectedType = ResourceType.VEHICLE;
        else if (q.contains("sport") || q.contains("court")) detectedType = ResourceType.SPORTS_FACILITY;

        Integer detectedCapacity = null;
        String[] words = q.split(" ");
        for (String word : words) {
            if (word.matches("\\d+")) {
                detectedCapacity = Integer.parseInt(word);
                break;
            }
        }

        String detectedLocation = null;
        if (q.contains("north")) detectedLocation = "North Wing";
        else if (q.contains("south")) detectedLocation = "South Wing";

        log.info("Parsed Intent Config - Type: {}, MinCap: {}, Loc: {}", detectedType, detectedCapacity, detectedLocation);

        List<Resource> resources = resourceRepository.searchResources(
                detectedType != null ? detectedType.name() : null,
                detectedCapacity,
                detectedLocation
        );
        return resources.stream().map(ResourceResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(UUID id) {
        Resource resource = resourceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        return ResourceResponse.from(resource);
    }

    @Transactional
    public ResourceResponse createResource(CreateResourceRequest request, UUID adminUserId) {
        log.info("Creating new resource: {}", request.getName());
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin User not found"));

        Resource newResource = Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(request.getLocation())
                .description(request.getDescription())
                .status(ResourceStatus.AVAILABLE)
                .createdBy(adminUser)
                .build();
        
        Resource savedResource = resourceRepository.save(newResource);
        return ResourceResponse.from(savedResource);
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
        return ResourceResponse.from(updatedResource);
    }

    @Transactional
    public void deleteResource(UUID id) {
        log.info("Soft-deleting resource ID: {}", id);
        Resource existing = resourceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        existing.setDeletedAt(LocalDateTime.now());
        existing.setStatus(ResourceStatus.RETIRED);
        resourceRepository.save(existing);
    }

    @Transactional
    public ResourceResponse changeResourceStatus(UUID id, ResourceStatus newStatus) {
        log.info("Changing status of resource ID: {} to {}", id, newStatus);
        Resource existing = resourceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        existing.setStatus(newStatus);
        return ResourceResponse.from(resourceRepository.save(existing));
    }

    @Transactional(readOnly = true)
    public List<ResourceAvailabilityResponse> getResourceAvailability(UUID id) {
        Resource existing = resourceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        return existing.getAvailabilities().stream()
                .map(ResourceAvailabilityResponse::from)
                .collect(Collectors.toList());
    }
}
