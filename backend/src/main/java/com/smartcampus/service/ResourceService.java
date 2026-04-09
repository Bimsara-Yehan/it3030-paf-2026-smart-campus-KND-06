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
        return resourceRepository.findAllByDeletedAtIsNull().stream()
                .map(ResourceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> searchResources(String typeStr, Integer minCapacity, String location) {
        ResourceType typeParam = null;
        if (typeStr != null && !typeStr.isEmpty() && !typeStr.equalsIgnoreCase("All Types")) {
            try {
                typeParam = ResourceType.valueOf(typeStr.toUpperCase().replace(" ", "_"));
            } catch (Exception e) {}
        }
        
        List<Resource> all = resourceRepository.findAllByDeletedAtIsNull();
        final ResourceType finalType = typeParam;
        
        return all.stream()
                .filter(r -> finalType == null || r.getType() == finalType)
                .filter(r -> minCapacity == null || r.getCapacity() >= minCapacity)
                .filter(r -> location == null || r.getLocation().toLowerCase().contains(location.toLowerCase()))
                .map(ResourceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> smartSearch(String naturalQuery) {
        log.info("Executing AI Smart Search for query: {}", naturalQuery);
        String q = naturalQuery.toLowerCase();
        
        // --- The Smart Search Lexical Parser ---
        // Maps natural language keywords to DB-valid resource types
        // DB constraint: LECTURE_HALL | LAB | MEETING_ROOM | EQUIPMENT
        ResourceType detectedType = null;
        if (q.contains("lab") || q.contains("laboratory") || q.contains("computer")) detectedType = ResourceType.LAB;
        else if (q.contains("lecture") || q.contains("hall") || q.contains("theatre") || q.contains("auditorium")) detectedType = ResourceType.LECTURE_HALL; 
        else if (q.contains("meeting") || q.contains("conference") || q.contains("room") || q.contains("pod") || q.contains("study")) detectedType = ResourceType.MEETING_ROOM;
        else if (q.contains("equipment") || q.contains("projector") || q.contains("camera") || q.contains("mic") || q.contains("laptop")) detectedType = ResourceType.EQUIPMENT;

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

        List<Resource> all = resourceRepository.findAllByDeletedAtIsNull();
        final ResourceType finalType = detectedType;
        final Integer finalCap = detectedCapacity;
        final String finalLoc = detectedLocation;

        return all.stream()
                .filter(r -> finalType == null || r.getType() == finalType)
                .filter(r -> finalCap == null || r.getCapacity() >= finalCap)
                .filter(r -> finalLoc == null || r.getLocation().toLowerCase().contains(finalLoc.toLowerCase()))
                .map(ResourceResponse::from)
                .collect(Collectors.toList());
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
                .status(ResourceStatus.ACTIVE)
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
        existing.setStatus(ResourceStatus.OUT_OF_SERVICE);
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
