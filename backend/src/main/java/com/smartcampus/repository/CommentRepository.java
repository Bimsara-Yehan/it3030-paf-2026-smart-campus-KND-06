package com.smartcampus.repository;

import com.smartcampus.entity.Comment;
import com.smartcampus.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for {@link Comment} entities.
 */
@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    /** Retrieves all comments for a specific ticket that are not soft-deleted. */
    List<Comment> findByTicketIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID ticketId);
}
