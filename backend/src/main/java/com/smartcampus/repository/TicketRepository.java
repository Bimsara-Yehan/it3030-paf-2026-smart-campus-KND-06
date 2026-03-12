package com.smartcampus.repository;

import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for {@link Ticket} entities.
 *
 * <p>Includes custom queries for soft-delete filtering and user-specific views
 * as specified in the Module C requirements.
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    /** Finds tickets created by a specific user that are not soft-deleted. */
    List<Ticket> findByReporterAndDeletedAtIsNull(User reporter);

    /** Finds all tickets across the system that are not soft-deleted (Admin/Technician view). */
    List<Ticket> findAllByDeletedAtIsNull();

    /** Finds a specific ticket by ID, ensuring it has not been soft-deleted. */
    Optional<Ticket> findByIdAndDeletedAtIsNull(UUID id);
    
    /** Finds tickets assigned to a specific technician. */
    List<Ticket> findByAssignedTechnicianAndDeletedAtIsNull(User technician);
}
