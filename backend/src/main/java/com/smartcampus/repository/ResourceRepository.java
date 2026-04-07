package com.smartcampus.repository;

import com.smartcampus.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    Optional<Resource> findByIdAndDeletedAtIsNull(UUID id);

    List<Resource> findAllByDeletedAtIsNull();

    @Query("SELECT r FROM Resource r WHERE r.deletedAt IS NULL AND " +
            "(:type IS NULL OR r.type = :type) AND " +
            "(:minCapacity IS NULL OR r.capacity >= :minCapacity) AND " +
            "(:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    List<Resource> searchResources(@Param("type") String type,
                                   @Param("minCapacity") Integer minCapacity,
                                   @Param("location") String location);
}
