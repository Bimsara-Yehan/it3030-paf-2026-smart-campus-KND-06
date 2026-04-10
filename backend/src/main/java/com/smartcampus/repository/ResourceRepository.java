package com.smartcampus.repository;

import com.smartcampus.entity.Resource;
import com.smartcampus.enums.ResourceStatus;
import com.smartcampus.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    Optional<Resource> findByIdAndDeletedAtIsNull(UUID id);

    List<Resource> findAllByDeletedAtIsNull();

    List<Resource> findByTypeAndDeletedAtIsNull(ResourceType type);

    List<Resource> findByStatusAndDeletedAtIsNull(ResourceStatus status);

    List<Resource> findByNameContainingIgnoreCaseAndDeletedAtIsNull(String name);

}
