package com.smartcampus.service;

import com.smartcampus.entity.ResourceAvailability;
import com.smartcampus.repository.ResourceAvailabilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceAvailabilityService {

    private final ResourceAvailabilityRepository availabilityRepository;

    @Transactional(readOnly = true)
    public List<ResourceAvailability> getAvailabilityForResource(UUID resourceId) {
        log.info("Fetching availability for resource ID: {}", resourceId);
        return availabilityRepository.findByResourceId(resourceId);
    }
}
