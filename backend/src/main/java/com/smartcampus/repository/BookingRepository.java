package com.smartcampus.repository;

import com.smartcampus.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    
    // Core query for checking overlap conflicts
    // Returns any APPROVED bookings for the same resource that overlap the requested time window
    @Query("SELECT b FROM Booking b " +
           "WHERE b.resource.id = :resourceId " +
           "AND b.status = 'APPROVED' " +
           "AND b.deletedAt IS NULL " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("resourceId") UUID resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
            
    // For finding alternative resources of the same type and minimum capacity
    // (Part of the Smart Alternatives innovation)
    @Query("SELECT r.id FROM Resource r " +
           "WHERE r.type = :resourceType AND r.capacity >= :minCapacity " +
           "AND r.id NOT IN (" +
           "  SELECT b.resource.id FROM Booking b " +
           "  WHERE b.status = 'APPROVED' " +
           "  AND b.startTime < :endTime " +
           "  AND b.endTime > :startTime" +
           ")")
    List<UUID> findAvailableAlternativeResources(
            @Param("resourceType") com.smartcampus.enums.ResourceType resourceType,
            @Param("minCapacity") Integer minCapacity,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    List<Booking> findByUserIdAndDeletedAtIsNull(UUID userId);
    
    List<Booking> findAllByDeletedAtIsNull();
    
    java.util.Optional<Booking> findByIdAndDeletedAtIsNull(UUID id);
}
