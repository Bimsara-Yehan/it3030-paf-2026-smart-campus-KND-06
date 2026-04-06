package com.smartcampus.repository;

import com.smartcampus.entity.ResourceAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceAvailabilityRepository extends JpaRepository<ResourceAvailability, UUID> {
    
    // Finds active availability records for a specific resource between the dates
    @Query("SELECT r FROM ResourceAvailability r " +
           "WHERE r.resource.id = :resourceId " +
           "AND r.isActive = true " +
           "AND r.availableFrom <= :endTime " +
           "AND r.availableTo >= :startTime")
    List<ResourceAvailability> findActiveAvailability(
            @Param("resourceId") UUID resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
