package com.smartcampus.repository;

import com.smartcampus.entity.ResourceAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceAvailabilityRepository extends JpaRepository<ResourceAvailability, UUID> {

    List<ResourceAvailability> findByResourceId(UUID resourceId);
    
    void deleteByResourceId(UUID resourceId);
}
