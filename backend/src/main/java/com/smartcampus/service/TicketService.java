package com.smartcampus.service;

import com.smartcampus.dto.request.AddCommentRequest;
import com.smartcampus.dto.request.CreateTicketRequest;
import com.smartcampus.dto.request.UpdateTicketStatusRequest;
import com.smartcampus.dto.response.AttachmentResponse;
import com.smartcampus.dto.response.CommentResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.entity.Comment;
import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.TicketAttachment;
import com.smartcampus.entity.User;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketAttachmentRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class for managing maintenance tickets, comments, and attachments.
 *
 * <p>Implementation notes:
 * <ul>
 *   <li>Enforces role-based security via {@code @PreAuthorize}.</li>
 *   <li>Implements soft deletion of tickets and comments.</li>
 *   <li>Calculates SLA-related timestamps (e.g. {@code resolvedAt}, {@code closedAt}).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;

    // ── Ticket Operations ─────────────────────────────────────────────────────

    /**
     * Creates a new ticket. Available to all authenticated users.
     */
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request) {
        User currentUser = getCurrentUser();
        
        Ticket ticket = Ticket.builder()
                .reporter(currentUser)
                .resourceId(request.getResourceId())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .preferredContact(request.getPreferredContact())
                .status(TicketStatus.OPEN)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        log.info("Ticket created: {} by user {}", savedTicket.getId(), currentUser.getEmail());
        
        // Placeholder for NotificationService call
        sendNotificationStub(currentUser, "Your ticket has been created successfully.");
        
        return TicketResponse.from(savedTicket);
    }

    /**
     * Retrieves all tickets. Restricted to ADMIN and TECHNICIAN roles.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAllByDeletedAtIsNull().stream()
                .map(TicketResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves tickets reported by the current user.
     */
    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets() {
        User currentUser = getCurrentUser();
        return ticketRepository.findByReporterAndDeletedAtIsNull(currentUser).stream()
                .map(TicketResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single ticket by ID. Enforces ownership or elevated role.
     */
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID id) {
        Ticket ticket = getTicketEntity(id);
        validateTicketAccess(ticket);
        return TicketResponse.from(ticket);
    }

    /**
     * Assigns a ticket to a technician. Restricted to ADMIN only.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public TicketResponse assignTicket(UUID id, UUID technicianId) {
        Ticket ticket = getTicketEntity(id);
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));

        if (!Boolean.TRUE.equals(technician.getIsActive())) {
            throw new BadRequestException("Cannot assign to an inactive user");
        }

        ticket.setAssignedTechnician(technician);
        ticket.setAssignedBy(getCurrentUser());
        ticket.setAssignedAt(LocalDateTime.now());
        
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        Ticket updatedTicket = ticketRepository.save(ticket);
        log.info("Ticket {} assigned to technician {}", id, technician.getEmail());
        
        sendNotificationStub(technician, "A new ticket has been assigned to you.");
        
        return TicketResponse.from(updatedTicket);
    }

    /**
     * Updates the status of a ticket. Restricted to TECHNICIAN only.
     */
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Transactional
    public TicketResponse updateTicketStatus(UUID id, UpdateTicketStatusRequest request) {
        Ticket ticket = getTicketEntity(id);
        User currentUser = getCurrentUser();

        // Ensure technician is only updating their assigned tickets
        if (ticket.getAssignedTechnician() == null || !ticket.getAssignedTechnician().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You can only update tickets assigned to you");
        }

        ticket.setStatus(request.getStatus());
        if (request.getStatus() == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolutionNotes(request.getNotes());
        }

        Ticket updatedTicket = ticketRepository.save(ticket);
        log.info("Ticket {} status updated to {} by technician {}", id, request.getStatus(), currentUser.getEmail());
        
        sendNotificationStub(ticket.getReporter(), "The status of your ticket has been updated to " + request.getStatus());

        return TicketResponse.from(updatedTicket);
    }

    /**
     * Closes a ticket. Restricted to ADMIN only.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public TicketResponse closeTicket(UUID id) {
        Ticket ticket = getTicketEntity(id);
        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());

        Ticket updatedTicket = ticketRepository.save(ticket);
        log.info("Ticket {} closed by admin", id);
        
        return TicketResponse.from(updatedTicket);
    }

    /**
     * Soft deletes a ticket. Restricted to ADMIN only.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteTicket(UUID id) {
        Ticket ticket = getTicketEntity(id);
        ticket.setDeletedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        log.info("Ticket {} soft deleted", id);
    }

    // ── Comment Operations ────────────────────────────────────────────────────

    /**
     * Adds a comment to a ticket.
     */
    @Transactional
    public CommentResponse addComment(UUID ticketId, AddCommentRequest request) {
        Ticket ticket = getTicketEntity(ticketId);
        validateTicketAccess(ticket);
        User currentUser = getCurrentUser();

        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(currentUser)
                .message(request.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);
        log.info("Comment added to ticket {} by {}", ticketId, currentUser.getEmail());
        
        return CommentResponse.from(savedComment);
    }

    /**
     * Lists all comments for a ticket.
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(UUID ticketId) {
        Ticket ticket = getTicketEntity(ticketId);
        validateTicketAccess(ticket);

        return commentRepository.findByTicketIdAndDeletedAtIsNullOrderByCreatedAtAsc(ticketId).stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
    }

    // ── Helper Methods ────────────────────────────────────────────────────────

    private Ticket getTicketEntity(UUID id) {
        return ticketRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private void validateTicketAccess(Ticket ticket) {
        User currentUser = getCurrentUser();
        boolean isAdmin = "ADMIN".equals(currentUser.getRole().name());
        boolean isTechnician = "TECHNICIAN".equals(currentUser.getRole().name());
        boolean isReporter = ticket.getReporter().getId().equals(currentUser.getId());

        if (!isAdmin && !isTechnician && !isReporter) {
            throw new ForbiddenException("You do not have permission to access this ticket");
        }
    }

    /**
     * Placeholder stub for NotificationService to ensure future compatibility.
     */
    private void sendNotificationStub(User user, String message) {
        log.warn("[STUB] Notification for {}: {}", user.getEmail(), message);
        // This will be replaced with member4's NotificationService.sendNotification(user, message);
    }
}
