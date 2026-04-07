package com.smartcampus.repository;

import com.smartcampus.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for Resource entities.
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {
}
