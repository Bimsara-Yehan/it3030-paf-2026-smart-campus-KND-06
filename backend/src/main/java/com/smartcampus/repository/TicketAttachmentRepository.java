package com.smartcampus.repository;

import com.smartcampus.entity.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for {@link TicketAttachment} entities.
 */
@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, UUID> {

    /** Retrieves all attachments for a specific ticket that are not soft-deleted. */
    List<TicketAttachment> findByTicketIdAndDeletedAtIsNull(UUID ticketId);
}
